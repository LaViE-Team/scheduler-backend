import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { Time, Class } from './timetable.classes'
import * as fs from 'fs'

@Injectable()
export class TimetableService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async generateTimetable(username: string, desiredSubjects: Array<string>) {
        const classList = await this.getClassList(username, desiredSubjects)
        if (!classList.length) return { highDensity: [], lowDensity: [] }

        const classIDGroup = this.getClassIDGroup(classList)
        const population = this.createTimetablePopulation(classList, classIDGroup)
        const { timetable_population, priority_point } = this.createTimetable(classList, population)

        const low_res = this.getLowDensityTimetable(priority_point, timetable_population)
        const high_res = this.getHighDensityTimetable(priority_point, timetable_population)

        const jsonClassList = classList.map((element) => element.toJson())
        await this.cacheManager.set(`class_list_${username}`, jsonClassList)

        return { highDensity: high_res, lowDensity: low_res }
    }

    async saveTimetable(username: string, extractedClasses: Array<any>, shared = false) {
        const classArr = []
        const classObjectArr = []

        classArr.push(['SubjectCode', 'ClassID', 'SubjectName', 'Day', 'StartTime', 'EndTime'])
        for (const extractedClass of extractedClasses) {
            const classObject = {
                subjectCode: extractedClass.subjectCode,
                subjectName: extractedClass.subjectName,
                classCode: extractedClass.classCode,
                time: [],
            }

            for (const time of extractedClass.time) {
                classObject.time.push({
                    day: time.day,
                    startTime: time.startTime,
                    endTime: time.endTime,
                })

                classArr.push([
                    extractedClass.subjectCode,
                    extractedClass.classCode,
                    extractedClass.subjectName,
                    time.day,
                    time.startTime,
                    time.endTime,
                ])
            }

            classObjectArr.push(classObject)
        }

        let fileName, fileString
        const timestamp = Date.now()

        fileName = `generated_files/${username}_${timestamp}.csv`
        fileString = classArr.map((element) => element.join(',')).join('\n')
        fs.writeFileSync(fileName, fileString, 'utf8')

        if (shared) {
            classArr.shift()
            fileName = `shared_files/${username}_${timestamp}.json`
            fileString = JSON.stringify(classObjectArr)
            fs.writeFileSync(fileName, fileString, 'utf8')
        }
        return fileName
    }

    private async getClassList(username: string, desiredSubjects: Array<string>): Promise<Array<Class>> {
        const subjects: Array<any> = await this.cacheManager.get(`csv_${username}`)
        let result = []
        let is_duplicate = 0
        for (const subjectCode of desiredSubjects) {
            const subjectIndex = subjects.findIndex((element) => element.subjectCode == subjectCode)
            if (subjectIndex == -1) return []

            const subject = subjects[subjectIndex]
            for (const classInfo of subject['classes']) {
                is_duplicate = 0
                const classInstance = new Class(subject.subjectCode, classInfo.classCode, subject.subjectName)
                for (const timeInfo of classInfo['time']) {
                    const time = new Time(timeInfo['day'], timeInfo['startTime'], timeInfo['endTime'])
                    classInstance.addTime(time)
                }
                console.log(classInstance)
                for (let i = 0; i < result.length; i++) {
                    if (
                        result[i]['time']['day'] == classInstance['time']['day'] &&
                        result[i]['moduleID'] != classInstance['moduleID']
                    ) {
                        const start_time_1 = result[i]['time'][0]['startTime'].replace(':', '')
                        const start_time_2 = classInstance['time'][0]['startTime'].replace(':', '')
                        const end_time_1 = result[i]['time'][0]['endTime'].replace(':', '')
                        const end_time_2 = classInstance['time'][0]['endTime'].replace(':', '')
                        if (
                            (Number(start_time_1) <= Number(start_time_2) &&
                                Number(end_time_1) >= Number(end_time_2)) ||
                            (Number(start_time_1) >= Number(start_time_2) && Number(end_time_1) <= Number(end_time_2))
                        ) {
                            is_duplicate = 1
                        }
                    }
                }
                if (is_duplicate == 0) {
                    result.push(classInstance)
                }
            }
        }
        const unique_module_id = Array.from(new Set(result.map((item) => item.moduleID)))
        if (unique_module_id.length != desiredSubjects.length) {
            return []
        }
        return result
    }

    private getClassIDGroup(classes: Array<Class>) {
        const classIDArr = []
        const unique_module_id = Array.from(new Set(classes.map((item) => item.moduleID)))
        for (const element of unique_module_id) {
            const class_has_same_module = []
            classes.forEach((item) => {
                if (item.moduleID === element) {
                    class_has_same_module.push(item.classID)
                }
            })
            classIDArr.push(class_has_same_module)
        }
        return classIDArr
    }

    private createTimetablePopulation(classes: Array<Class>, class_id_group: Array<string>) {
        const cartesian = (...a) => a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())))
        let population = []
        if (class_id_group.length == 1) {
            for (let i = 0; i < class_id_group[0].length; i++) {
                population.push([class_id_group[0][i]])
            }
        } else {
            population = cartesian(...class_id_group)
        }
        return population
    }

    private createTimetable(classes: Array<Class>, population: Array<string>) {
        const timetable_population = []
        const priority_point = []
        for (const element of population) {
            const monday = []
            const tuesday = []
            const thursday = []
            const wednesday = []
            const friday = []
            const saturday = []
            const sunday = []
            const week = []
            for (let j = 0; j < element.length; j++) {
                classes.forEach((item) => {
                    if (element[j] == item.classID) {
                        for (const element of item.time) {
                            if (element.day == 'Mon') {
                                monday.push(item)
                            } else if (element.day == 'Tue') {
                                tuesday.push(item)
                            } else if (element.day == 'Wed') {
                                wednesday.push(item)
                            } else if (element.day == 'Thu') {
                                thursday.push(item)
                            } else if (element.day == 'Fri') {
                                friday.push(item)
                            } else if (element.day == 'Sat') {
                                saturday.push(item)
                            } else if (element.day == 'Sun') {
                                sunday.push(item)
                            }
                        }
                    }
                })
            }
            week.push(monday, tuesday, wednesday, thursday, friday, saturday, sunday)
            const point = this.calculatePriority(week)
            week.push(point)
            priority_point.push(point)
            timetable_population.push(week)
        }
        return {
            timetable_population: timetable_population,
            priority_point: priority_point,
        }
    }

    private calculatePriority(timetable: Array<Array<Class>>) {
        let scheduled_days = 0
        let empty_time = 0

        for (const element of timetable) {
            if (element.length > 1) {
                for (let n = 0; n < element.length - 1; n++) {
                    let end_time = element[n].time[0].endTime
                    let start_time = element[n + 1].time[0].startTime
                    end_time = end_time.replace(':', '')
                    start_time = start_time.replace(':', '')
                    empty_time = empty_time + Math.abs(Number(start_time) - Number(end_time))
                }
            }
            if (element.length > 0) {
                scheduled_days = scheduled_days + 1
            }
        }
        if (empty_time == 0) {
            return 1 / scheduled_days
        }
        return 1 / scheduled_days + 1 / (empty_time * 0.5)
    }

    private getLowDensityTimetable(priority_point: Array<number>, timetable: Array<Array<any>>) {
        let i
        let minPoint = priority_point[0]
        const result = []
        for (i = 1; i < priority_point.length; i++) {
            if (priority_point[i] < minPoint) {
                minPoint = priority_point[i]
            }
        }
        for (i = 0; i < timetable.length; i++) {
            const class_id = []
            if (timetable[i][timetable[i].length - 1] == minPoint) {
                for (let j = 0; j < timetable[i].length - 1; j++) {
                    if (Object.keys(timetable[i][j]).length !== 0) {
                        for (const row in timetable[i][j]) {
                            class_id.push(timetable[i][j][row].classID)
                        }
                    }
                }
                result.push(class_id)
            }
        }
        return result
    }

    private getHighDensityTimetable(priority_point: Array<number>, timetable: Array<Array<any>>) {
        let i
        let maxPoint = priority_point[0]
        const result = []
        for (i = 1; i < priority_point.length; i++) {
            if (priority_point[i] > maxPoint) {
                maxPoint = priority_point[i]
            }
        }
        for (i = 0; i < timetable.length; i++) {
            const class_id = []
            if (timetable[i][timetable[i].length - 1] == maxPoint) {
                for (let j = 0; j < timetable[i].length - 1; j++) {
                    if (Object.keys(timetable[i][j]).length !== 0) {
                        for (const row in timetable[i][j]) {
                            class_id.push(timetable[i][j][row].classID)
                        }
                    }
                }
                result.push(class_id)
            }
        }
        return result
    }
}
