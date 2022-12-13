export interface _Time{ 
    day: String;
    startTime: String;
    endTime: String;
}

export interface _Class{
    classID: String;
    moduleID: String;
    name:String;
    time: Array<_Time>;
}