import React from 'react';
import moment from 'moment';

const HOURLYWAGE = 4.25;
const EVECOMPEN = 1.25;
let allData = [];

export const WageCounter = props => {
    let ids = [];
    let rawData = props.employees;

    //Make an array about person's infor
    for (let k = 1; k < rawData.length; k++) {
        let id = parseInt(rawData[k][1]);
        let name = rawData[k][0];
        if (ids.indexOf(id) === -1) {
            ids.push(id);
            let personData = {
                'id': id,
                'name': name,
                'totalWage': 0,
                'totalHours': 0,
                'overtimeHours': 0,
                'overtimePay': 0,
                'eveningHours': 0,
                'eveningPay': 0
            };
            allData.push(personData);
        }
    }

    for (let m = 1; m < rawData.length; m++) {
        let dataRow = rawData[m];
        let personId = dataRow[1];

        let dateInfo = getDateInfo(dataRow);
        for (let n = 0; n < allData.length; n++) {
            if (parseInt(allData[n].id) === parseInt(personId)) {
                let dayTotals = calculateDayTotals(dateInfo.date, dateInfo.startTime, dateInfo.endTime);
                allData[n].totalWage += dayTotals.totalDayWage;
                allData[n].totalHours += dayTotals.totalDayHours;
                allData[n].overtimeHours += getOvertimeHours(dayTotals.totalDayHours);
                allData[n].overtimePay += calculateOvertimePay(dayTotals.totalDayHours);
                allData[n].eveningHours += getEveningHours(dateInfo.date, dateInfo.startTime, dateInfo.endTime);
                allData[n].eveningPay += calculateEveningPay(getEveningHours(dateInfo.date, dateInfo.startTime, dateInfo.endTime));
            }
        }
    }

    const list = allData.map((_employee) =>
        <tr key={_employee.id}>
            <td>{_employee.id}</td>
            <td>{_employee.name}</td>
            <td>{_employee.totalHours}</td>
            <td>{_employee.overtimeHours}</td>
            <td>{_employee.eveningHours}</td>
            <td>{Math.round(_employee.totalWage * 100) /100}</td>
        </tr>
    );

    return <div className='wage-counter'>
        <div className="title-monthYear">Monthly Wages {props.monthYear}</div>
        <table className='table table-striped'>
            <thead>
                <tr>
                    <th scope='col'>ID</th>
                    <th scope='col'>Name</th>
                    <th scope='col'>Work Hours (h)</th>
                    <th scope='col'>Overtime Hours (h)</th>
                    <th scope='col'>Evening Hours (h)</th>
                    <th scope='col'>Total Wage ($)</th>
                </tr>
            </thead>
            <tbody>
                {list}
            </tbody>
        </table>
    </div>;
}

function getDateInfo(dataRow) {
    let rawDate = dataRow[2];
    let rawStartTime = dataRow[3];
    let rawEndTime = dataRow[4];

    let date = moment(rawDate, 'DD-MM-YYYY');
    let startTime = getStartTime(date, rawStartTime);
    let endTime = getEndTime(date, startTime, rawEndTime);

    let converted = {
        'date': date,
        'startTime': startTime,
        'endTime': endTime,
    };

    return converted;
}

function getStartTime(date, rawStartTime) {
    let startTimeData = rawStartTime.split(':'),
        startHour = parseInt(startTimeData[0]),
        startMinutes = parseInt(startTimeData[1]);

    let startTime = date.clone().hour(startHour).minute(startMinutes);

    return startTime;
}

function getEndTime(date, startTime, rawEndTime) {
    let endTimeData = rawEndTime.split(':'),
        endHour = parseInt(endTimeData[0]),
        endMinutes = parseInt(endTimeData[1]);

    let endTime;

    if (endHour < startTime.hour()) {
        endTime = date.clone().add(1, 'day').hour(endHour).minute(endMinutes);
    } else {
        endTime = date.clone().hour(endHour).minute(endMinutes);
    }

    return endTime;
}

function calculateDayTotals(date, startTime, endTime) {
    let dayWage = 0;

    //minutes per day
    let totalDayMinutes = endTime.diff(startTime, 'minutes');

    //convert minutes to hours
    let totalDayHours = Math.round((totalDayMinutes / 60) * 100) / 100;

    dayWage += Math.round((totalDayHours * HOURLYWAGE) * 100) / 100;

    //add overtime and evening pay
    dayWage += Math.round(calculateOvertimePay(totalDayHours) * 100) / 100;
    dayWage += Math.round(calculateEveningPay(getEveningHours(date, startTime, endTime)) * 100) / 100;

    let totals = { 'totalDayHours': totalDayHours, 'totalDayWage': dayWage };

    return totals;
}

function getOvertimeHours(totalDayHours) {
    let normalHours = 8;
    let overtime = totalDayHours - normalHours;
    if (overtime < 0) overtime = 0;

    return overtime;
}

function calculateOvertimePay(totalDayHours) {
    let overtime = getOvertimeHours(totalDayHours);
    let overtimePay = 0;

    //for hours that exceed 8+4, add 100% pay
    if (overtime > 4) {
        overtimePay += (overtime - 4) * HOURLYWAGE;
        overtime = 4;
    }
    //for overtime that are between 3 and 4, add 50% pay
    if (overtime > 3) {
        overtimePay += (overtime - 3) * 0.5 * HOURLYWAGE;
        overtime = 3;
    }
    //first 3 hours, add 25% pay
    if (overtime > 0) {
        overtimePay += overtime * 0.25 * HOURLYWAGE;
    }

    overtimePay = Math.round(overtimePay * 100) / 100;

    return overtimePay;
}

function getEveningHours(date, startTime, endTime) {
    let startHour = 19;
    let endHour = 6;

    let eveningStart = date.clone().hour(startHour);
    let eveningEnd = date.clone().add(1, 'day').hour(endHour);

    let eveningMinutes = 0;

    if (startTime.isBetween(eveningStart, eveningEnd, '[]')) {
        if (endTime.isBetween(eveningStart, eveningEnd, '[]')) {
            eveningMinutes = endTime.diff(startTime, 'minutes');
        } else {
            eveningMinutes = eveningEnd.diff(startTime, 'minutes');
        }
    } else if (endTime.isBetween(eveningStart, eveningEnd, '[]')) {
        eveningMinutes = endTime.diff(eveningStart, 'minutes');
    }

    let eveningHours = Math.round((eveningMinutes / 60) * 100) / 100;

    return eveningHours;
}

function calculateEveningPay(eveningHours) {
    let eveningPay = Math.round(eveningHours * EVECOMPEN *100) / 100;
    return eveningPay;
}