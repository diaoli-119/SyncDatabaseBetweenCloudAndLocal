/*
 * @Author: your name
 * @Date: 2021-03-04 11:41:33
 * @LastEditTime: 2021-03-16 15:27:15
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \sync_cpy_from_cloud\Venue\app.js
 */
 
const fs = require('fs');

class readDbOpLog {
  constructor(tabName) {
    this.tabName = tabName;
    this.fileSuffix = '/home/pi/Log_';
  }
  
  generateFilePath () {
    this.createdFile = this.fileSuffix + this.tabName + '/_create.txt';
    this.updatedFile = this.fileSuffix + this.tabName + '/_update.txt';
    this.deletedFile = this.fileSuffix + this.tabName + '/_delete.txt';
  }
  
  readLog () {
    this.generateFilePath();
    fs.access(this.createdFile, fs.F_OK, (err)=> {
      if (err){
        return;
      }
      let insertModule = require('./inserted');
      insertModule(this.tabName);
    });
    fs.access(this.deletedFile, fs.F_OK, (err)=> {
      if (err){
        return;
      }
      let deleteModule = require('./deleted');
      deleteModule(this.tabName);
    });
    fs.access(this.updatedFile, fs.F_OK, (err)=> {
      if (err){
        return;
      }
      let updateModule = require('./updated');
      updateModule(this.tabName);
    });
  }  
}

const checkFiles = async () => {
  let syncAddressIns = new readDbOpLog('Address');
  syncAddressIns.readLog();
  let syncBoardingIns = new readDbOpLog('Boarding');
  syncBoardingIns.readLog();
  let syncDeviceIns = new readDbOpLog('Device');
  syncDeviceIns.readLog();
  let syncDevInfoIns = new readDbOpLog('DevInfo');
  syncDevInfoIns.readLog();
  let syncEmgCntInfoIns = new readDbOpLog('EmgcyContactInfo');
  syncEmgCntInfoIns.readLog();
  let syncOwnerGroupIns = new readDbOpLog('OwnerGroup');
  syncOwnerGroupIns.readLog();
  let syncPointIns = new readDbOpLog('Point');
  syncPointIns.readLog();
  let syncVenuetIns = new readDbOpLog('Venue');
  syncVenuetIns.readLog();
  let syncV0000001Ins = new readDbOpLog('V0000001');
  syncV0000001Ins.readLog();
  let syncBuildingIns = new readDbOpLog('Building');
  syncBuildingIns.readLog();
  let syncClientListIns = new readDbOpLog('ClientList');
  syncClientListIns.readLog();
  let syncNodeInfoIns = new readDbOpLog('NodeInfo');
  syncNodeInfoIns.readLog();
  let syncPlateIns = new readDbOpLog('Plate');
  syncPlateIns.readLog();
  let syncNotificationAlarmIns = new readDbOpLog('NotificationAlarm');
  syncNotificationAlarmIns.readLog();
}

checkFiles();