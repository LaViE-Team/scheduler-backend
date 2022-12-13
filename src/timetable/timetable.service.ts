import { _Time } from './timetable.interface'
import { _Class} from './timetable.interface'

export class Time implements _Time{
    day: String;
    startTime: String;
    endTime: String;
    constructor( day: String, startTime: String, endTime:String){
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

export class Class implements _Class {
    classID: String;
    moduleID: String;
    name:String;
    time: Array<Time>;
    constructor( moduleID: String, classID: String, name:String){
        this.classID = classID;
        this.moduleID = moduleID;
        this.name = name;
    }
}
