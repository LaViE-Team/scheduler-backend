export class Time {
    day: string
    startTime: string
    endTime: string
    constructor(day: string, startTime: string, endTime: string) {
        this.day = day
        this.startTime = startTime
        this.endTime = endTime
    }
}

export class Class {
    classID: string
    moduleID: string
    name: string
    time: Array<Time>

    constructor(moduleID: string, classID: string, name: string) {
        this.classID = classID
        this.moduleID = moduleID
        this.name = name
        this.time = []
    }

    addTime(time: Time) {
        this.time.push(time)
    }

    toJson() {
        const result = {
            subjectCode: this.classID,
            subjectName: this.name,
            classCode: this.classID,
            time: [],
        }
        for (const time of this.time) {
            result.time.push({
                day: time.day,
                startTime: time.startTime,
                endTime: time.endTime,
            })
        }

        return result
    }
}
