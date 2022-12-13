
import { Controller, Req, Get, Post, Body } from '@nestjs/common'
import { Time,Class } from './timetable.service'

import { readFileSync, writeFileSync, promises as fsPromises } from 'fs';
import { join } from 'path';


// @Controller('timetable')
// export class ItemsController {
var fs = require("fs");
var parse = require("csv-parse").parse;
var list : Array<Class> = [];
var priority_point = [];
var timetable_population = [];

function getClasses(){
    fs.createReadStream("dataset.csv")
    .pipe(parse({ delimiter: ";", from_line: 2 }))
    .on("data", function (row) {
        if (list.length > 0) {
            var is_updated = 0;
            var classTime = new Time(row[3],row[4],row[5]);
            for (var i = 0; i < list.length; i++) {
                if(row[1] == list[i].classID) {
                    list[i].time.push(classTime);
                    is_updated = 1;
                }
            }
            if (is_updated == 0){
                var record = new Class(row[0], row[1], row[2]);
                record.time = [];
                record.time.push(classTime);
                list.push(record);
            }
        }else {
            var classTime = new Time(row[3],row[4],row[5]);
            var record = new Class(row[0], row[1], row[2]);
            record.time = [];
            record.time.push(classTime);
            list.push(record);
        }
        }).on("end", function () {
            console.log(list);
            console.log(list[0]);
            var class_id_group = getClassIDGroup(list);
            var population = createTimetablePopulation(list,class_id_group);
            timetable_population = createTimetable(list,population);
            var low_res = getLowDensityTimetable(priority_point,timetable_population);
            var high_res = getHighDensityTimetable(priority_point,timetable_population);
            exportCSVFile(low_res,'low');
            exportCSVFile(high_res,'high');
        })
}
function getClassIDGroup(classes: Array<Class>) {
        var classIDArr = [];
        const unique_module_id = Array.from(new Set(classes.map((item) => item.moduleID)));
        for(var i = 0; i < unique_module_id.length; i++) {
            var class_has_same_module = [];
            for(var j = 0; j < classes.length;j++){
                if(classes[j].moduleID === unique_module_id[i]){
                    class_has_same_module.push(classes[j].classID);
                }
            }
            classIDArr.push(class_has_same_module);
        }
        return classIDArr;
}
function createTimetablePopulation(classes: Array<Class>, class_id_group:Array<String>){
    const cartesian =(...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    let population = cartesian(...class_id_group);
    return population;
}
function createTimetable(classes: Array<Class>, population:Array<String>){
    for(var i = 0; i < population.length; i++){
        var monday = [];
        var tuesday = []; 
        var thursday = []; 
        var wednesday = []; 
        var friday = []; 
        var saturday = [];
        var sunday = []; 
        var week =[];
        for(var j = 0; j < population[i].length - 1; j++){
            for(var k = 0; k < classes.length; k++){
                if(population[i][j] == classes[k].classID){
                    for (var l = 0; l < classes[k].time.length; l++){
                        if(classes[k].time[l].day == 'Mon'){
                            monday.push(classes[k]);
                        } else if(classes[k].time[l].day == 'Tue'){
                            tuesday.push(classes[k]);
                        } else if(classes[k].time[l].day == 'Wed'){
                            wednesday.push(classes[k]);
                        } else if(classes[k].time[l].day == 'Thu'){
                            thursday.push(classes[k]);
                        } else if(classes[k].time[l].day == 'Fri'){
                            friday.push(classes[k]);
                        } else if(classes[k].time[l].day == 'Sat'){
                            saturday.push(classes[k]);
                        } else if(classes[k].time[l].day == 'Sun'){
                            sunday.push(classes[k]);
                        }
                    }
                }
            }
        }
        week.push(monday,tuesday,wednesday,thursday,friday,saturday,sunday);
        var point = calculatePriority(week);
        week.push(point);
        priority_point.push(point);
        timetable_population.push(week);
    }
    return timetable_population;
}
function calculatePriority(timetable: Array<Array<Class>>){
    var scheduled_days = 0;
    var empty_time = 0;

    for (var m = 0; m < timetable.length; m++){
        if(timetable[m].length > 1){
            for(var n = 0; n < timetable[m].length-1; n++){
                var end_time = timetable[m][n].time[0].endTime;
                var start_time = timetable[m][n+1].time[0].startTime;
                end_time = end_time.replace(':','');
                start_time = start_time.replace(':','');
                empty_time = empty_time + Math.abs(Number(start_time) - Number(end_time));
            }
        } 
        if(timetable[m].length > 0){
            scheduled_days = scheduled_days + 1;
        }
    }
    
    // console.log(scheduled_days);
    return 1/scheduled_days + 1/(empty_time*0.5);
}
function getLowDensityTimetable(priority_point: Array<Number>, timetable: Array<Array<Object>>){
    var minPoint = priority_point[0];
    var result = [];
    for (var i = 1; i < priority_point.length; i++){
        if(priority_point[i] <  minPoint){
            minPoint = priority_point[i];
        }
    }
    for (var i = 0; i < timetable.length; i++){
        var class_id = [];
        if(timetable[i][timetable[i].length-1] == minPoint){
            for(var j = 0; j<timetable[i].length-1; j++){
                if (Object.keys(timetable[i][j]).length  !== 0){
                    for(var row in timetable[i][j]){
                        class_id.push(timetable[i][j][row].classID);
                    }
                }
            }
            result.push(class_id);
        }
    }
    return result;
}
function getHighDensityTimetable(priority_point: Array<Number>, timetable: Array<Array<Object>>){
    var maxPoint = priority_point[0];
    var result = [];
    for (var i = 1; i < priority_point.length; i++){
        if(priority_point[i] > maxPoint){
            maxPoint = priority_point[i];
        }
    }
    for (var i = 0;i < timetable.length; i++){
        var class_id = [];
        if(timetable[i][timetable[i].length-1] == maxPoint){
            for(var j = 0; j<timetable[i].length-1; j++){
                if (Object.keys(timetable[i][j]).length  !== 0){
                    for(var row in timetable[i][j]){
                        class_id.push(timetable[i][j][row].classID);
                    }
                }
            }
            result.push(class_id);
        }
        
    }
    return result;
}
function exportCSVFile(timetable: Array<Array<String>>,type: String){
    
    for (var i = 0; i < timetable.length; i++){
        var week = Array.from(new Set(timetable[i].map((item) => item)));
        var classArr = [];
        classArr.push(['ModuleID','ClassID','Name','Day','StartTime','EndTime']);
        for(var j = 0; j <week.length; j++){
            for(var k = 0; k<list.length; k++){
                if(week[j] == list[k].classID){ 
                    for(var l = 0; l < list[k].time.length; l++){
                        var classInfo = [];
                        classInfo.push(list[k].moduleID);
                        classInfo.push(list[k].classID);
                        classInfo.push(list[k].name);
                        classInfo.push(list[k].time[l].day);
                        classInfo.push(list[k].time[l].startTime);
                        classInfo.push(list[k].time[l].endTime);
                        classArr.push(classInfo);
                    }   
                }
            }
        }
        if(type == 'low'){
            var file_name = '/csv/LowDensity/'.concat(new Date().getTime().toString()).concat('.csv');
        }else{
            var file_name = '/csv/HighDensity/'.concat(new Date().getTime().toString()).concat('.csv');
        }
        syncWriteFile(file_name,classArr.map(e => e.join(';')).join('\n'));
    }
    

}
getClasses();

function syncWriteFile(filename: string, data: any) {
    writeFileSync(join(__dirname, filename), data, {
      flag: 'w',
    });
}
