import React from 'react';
import moment from 'moment';

const HOURLYWAGE = 4.25;
const EVECOMPEN = 1.25;
var allData = [];

export const WageCounter = props => {
    var ids = [];
    var rawData = props.employees;

    //Make an array about person's infor
    for (var k = 1; k < rawData.length; k++) {
        var id = parseInt(rawData[k][1]);
        var name = rawData[k][0];
        if (ids.indexOf(id) === -1) {
            ids.push(id);
            var personData = {
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

    for (var m = 1; m < rawData.length; m++) {
        var dataRow = rawData[m];
        var personId = dataRow[1];

        var dateInfo = getDateInfo(dataRow);
        for (var n = 0; n < allData.length; n++) {
            if (parseInt(allData[n].id) === parseInt(personId)) {
                var dayTotals = calculateDayTotals(dateInfo.date, dateInfo.startTime, dateInfo.endTime);
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
    var rawDate = dataRow[2];
    var rawStartTime = dataRow[3];
    var rawEndTime = dataRow[4];

    var date = moment(rawDate, 'DD-MM-YYYY');
    var startTime = getStartTime(date, rawStartTime);
    var endTime = getEndTime(date, startTime, rawEndTime);

    var converted = {
        'date': date,
        'startTime': startTime,
        'endTime': endTime,
    };

    return converted;
}

function getStartTime(date, rawStartTime) {
    var startTimeData = rawStartTime.split(':'),
        startHour = parseInt(startTimeData[0]),
        startMinutes = parseInt(startTimeData[1]);

    var startTime = date.clone().hour(startHour).minute(startMinutes);

    return startTime;
}

function getEndTime(date, startTime, rawEndTime) {
    var endTimeData = rawEndTime.split(':'),
        endHour = parseInt(endTimeData[0]),
        endMinutes = parseInt(endTimeData[1]);

    var endTime;

    if (endHour < startTime.hour()) {
        endTime = date.clone().add(1, 'day').hour(endHour).minute(endMinutes);
    } else {
        endTime = date.clone().hour(endHour).minute(endMinutes);
    }

    return endTime;
}

function calculateDayTotals(date, startTime, endTime) {
    var dayWage = 0;

    //minutes per day
    var totalDayMinutes = endTime.diff(startTime, 'minutes');

    //convert minutes to hours
    var totalDayHours = Math.round((totalDayMinutes / 60) * 100) / 100;

    dayWage += Math.round((totalDayHours * HOURLYWAGE) * 100) / 100;

    //add overtime and evening pay
    dayWage += Math.round(calculateOvertimePay(totalDayHours) * 100) / 100;
    dayWage += Math.round(calculateEveningPay(getEveningHours(date, startTime, endTime)) * 100) / 100;

    var totals = { 'totalDayHours': totalDayHours, 'totalDayWage': dayWage };

    return totals;
}

function getOvertimeHours(totalDayHours) {
    var normalHours = 8;
    var overtime = totalDayHours - normalHours;
    if (overtime < 0) overtime = 0;

    return overtime;
}

function calculateOvertimePay(totalDayHours) {
    var overtime = getOvertimeHours(totalDayHours);
    var overtimePay = 0;

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
    var startHour = 19;
    var endHour = 6;

    var eveningStart = date.clone().hour(startHour);
    var eveningEnd = date.clone().add(1, 'day').hour(endHour);

    var eveningMinutes = 0;

    if (startTime.isBetween(eveningStart, eveningEnd, '[]')) {
        if (endTime.isBetween(eveningStart, eveningEnd, '[]')) {
            eveningMinutes = endTime.diff(startTime, 'minutes');
        } else {
            eveningMinutes = eveningEnd.diff(startTime, 'minutes');
        }
    } else if (endTime.isBetween(eveningStart, eveningEnd, '[]')) {
        eveningMinutes = endTime.diff(eveningStart, 'minutes');
    }

    var eveningHours = Math.round((eveningMinutes / 60) * 100) / 100;

    return eveningHours;
}

function calculateEveningPay(eveningHours) {
    var eveningPay = Math.round(eveningHours * EVECOMPEN *100) / 100;
    return eveningPay;
}