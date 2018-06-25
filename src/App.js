import React, { Component } from 'react';
import './App.css';
import { WageCounter } from './wageCounter.js';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      employees: [],
      month: [],
      isHidden: true
    };

  }

  handleFileChosen = (e) => {

    var fileReader = new FileReader();

    if (this.state.employees !== undefined || this.state.employees.length !== 0) {
      document.getElementById('file').disabled = true;
    }
    try {
      fileReader.onload = () => {
        var content = fileReader.result; //csv's data

        var csvData = [];
        var allLines = content.split(/\r\n|\n/);
        var header = allLines[0].split(',');

        //Ignore the header in loop
        for (var i = 1; i < allLines.length; i++) {
          var data = allLines[i].split(',');

          // Month+Year. don't know why it takes the hours also.
          var time = allLines[1].split('.')[1] + '/' + allLines[1].split('.')[2];
          var monthYear = time.substring(0, 6);

          if (data.length === header.length) {
            var tarr = [];
            for (var j = 0; j < header.length; j++) {
              tarr.push(data[j]);
            }
            csvData.push(tarr);
          }
        }

        let allContent = { ...this.state, employees: csvData, month: monthYear }
        this.setState(allContent);
      };

      fileReader.readAsText(e.target.files[0]);
    }
    catch (err) {
      console.log(err.message)
    }

  };

  toggleHidden = () => {
    if (this.state.employees === undefined || this.state.employees.length === 0) {
      alert('Please select a file to read first.');
    } else {
      if (this.state.isHidden === true) {
        this.setState({
          isHidden: !this.state.isHidden
        })
      }
      else document.getElementById('btnCal').disabled = true;
    }
  }

  reload = () => {
    window.location.reload();
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Wage calculator</h1>
        </header>
        <div className="info">
          <p>Please select the csv file to read.
          <br />The example file is in 'data' folder.
        </p>
        </div>

        <input type='file' id='file' accept='.csv' onChange={this.handleFileChosen} />
        <button className='btn' onClick={this.reload}>Reload</button>
        <div className="content">
          <button className="btn btn-primary" id="btnCal" onClick={this.toggleHidden}>Calculate Monthly Wages</button>
          {!this.state.isHidden && <WageCounter employees={this.state.employees} monthYear={this.state.month} />}
        </div>
      </div>
    );
  }
}

export default App;

