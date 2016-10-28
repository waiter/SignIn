import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  DeviceEventEmitter,
  Alert
} from 'react-native';
import Calendar from './components/Calendar';
import BindComponent from './components/BindComponent';
import DataHelper from './data/helper';
import moment from 'moment';
import DatePicker from 'rmc-date-picker';
import Popup from 'rmc-date-picker/lib/Popup';
import PopupStyles from 'rmc-date-picker/lib/PopupStyles';


const signKey = 'signDatas';

class SignIn extends BindComponent {
  constructor(props) {
    super(props, ['initData', 'saveData', 'makeNoteAndAction',
    'addTimer', 'resumeCheck', 'isTodayIn', 'reRender',
    'saveNewData', 'showDatePicker', 'dismissDatePicker',
    'changeDate', 'doConfirm']);
    this.state = {
      datas: [],
      isInit: false,
      isSaving: false,
      resume: 1,
      visible: false,
    };
    this.initData();
  }

  isTodayIn() {
    const today = moment().format('YYYY-MM-DD');
    if (this.state.datas.indexOf(today) > -1) {
      return true;
    }
    return false;
  }

  addTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const needTime = (moment().endOf('day').unix() - moment().unix() + 2) * 1000;
    this.timer = setTimeout(this.reRender, needTime);
  }

  reRender() {
    this.setState({
      resume: this.state.resume + 1,
    });
  }

  resumeCheck() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.isTodayIn()) {
      this.reRender();
    }
    this.addTimer();
  }

  async initData() {
    try {
      // await DataHelper.deleteOneAsync(signKey);
      const dd = await DataHelper.getAllDataAsync();
      this.setState({
        datas: JSON.parse(dd[signKey] || '[]'),
        isInit: true,
      });
      this.addTimer();
      DeviceEventEmitter.addListener("deviceResume", this.resumeCheck);
    } catch(e) {
      console.log(e);
    }
  }

  saveData() {
    if (!this.state.isInit) {
      alert('正在初始化...');
    } else if (this.state.isSaving) {
      alert('保存中...');
    } else {
      const today = moment().format('YYYY-MM-DD');
      this.doConfirm(this.isTodayIn(), today, false);
    }
  }

  doConfirm(isDone, day, isBefore) {
    if (isDone) {
      Alert.alert('你确定吗？', isBefore ? `要退掉${day}的签？`: `要取消打卡吗？`,
      [{text: isBefore ? '不退不退' : '不取消'},
      {text: '确定！', onPress: () => {
        const newO = Object.assign([], this.state.datas);
        newO.splice(newO.indexOf(day), 1);
        this.saveNewData(newO);
        this.dismissDatePicker();
      }}]);
    } else {
      Alert.alert('你确定吗？', isBefore ? `要补${day}的签？` : `要打卡了？？`, [
        {text: isBefore ? `不补` : '不打'},
      {text: '确定！', onPress: () => {
        Alert.alert('真得确定吗？', '真的看足半个小时的Python了吗？', [{text: '你妹！'},
        {text: '我看了！真的看了！你不相信我！我不理你了！', onPress: () => {
          const newO = Object.assign([], this.state.datas);
          newO.push(day);
          newO.sort();
          this.saveNewData(newO);
          this.dismissDatePicker();
        }}]);
      }}]);
    }
  }

  async saveNewData(datas) {
    this.setState({
      datas: datas,
      isSaving: true,
    });
    await DataHelper.saveDatasAsync({
      [signKey]: JSON.stringify(datas)
    });
    setTimeout(() => {
      this.setState({
        isSaving: false
      });
    }, 500);
  }

  makeNoteAndAction(datas) {
    const note = {};
    const active = {};
    (datas || []).forEach(da => {
      note[da] = '已打卡';
      active[da] = 'border';
    });
    return [note, active, datas.length]
  }

  showDatePicker() {
    this.setState({
      visible: true
    });
  }

  dismissDatePicker() {
    this.setState({
      visible: false,
    });
  }

  changeDate(mom) {
    if (!this.state.isInit) {
      alert('正在初始化...');
    } else if (this.state.isSaving) {
      alert('保存中...');
    } else {
      const day = mom.format('YYYY-MM-DD');
      const isDone = this.state.datas.indexOf(day) > -1;
      this.doConfirm(isDone, day, true);
    }
  }

  render() {
    const {isInit, datas, isSaving, visible} = this.state;
    const [note, active, len] = this.makeNoteAndAction(datas);
    let word = '打卡';
    let tword = '退/补签';
    if (!isInit) {
      word = '读取数据中...';
      tword = word;
    } else if (isSaving) {
      word = '保存中...';
      tword = word;
    } else{
      if (this.isTodayIn()) {
        word = '已打卡';
      }
    }
    const view = isSaving || !isInit ?
    (
      <View style={styles.click}>
        <Text style={styles.clickWord}>{word}</Text>
      </View>
    ) : (
      <Calendar
        style={styles.calendar}
        note={note}
        active={active}
        startTime='2016-10-01'
        endTime={moment().add(1, 'month')}
      />
    );
    const yestoday = moment().subtract(1, 'days');

    return (
      <View style={styles.container}>
        <View style={styles.pp}>
          <Text style={styles.ppWord}>Hi pipi!已打卡{len}天</Text>
        </View>
        {view}
        <TouchableOpacity style={styles.click} onPress={this.saveData}>
          <View>
            <Text style={styles.clickWord}>{word}</Text>
          </View>
        </TouchableOpacity>
        <Popup
          datePicker={<DatePicker
            defaultDate={yestoday}
            maxDate={yestoday}
            />}
          visible={visible}
          styles={PopupStyles}
          dismissText="取消"
          okText="确定"
          title="选择退/补签日期"
          date={yestoday}
          onDismiss={this.dismissDatePicker}
          onChange={this.changeDate}
        >
        <TouchableOpacity style={styles.addtion} onPress={this.showDatePicker}>
          <View>
            <Text style={styles.clickWord}>{tword}</Text>
          </View>
        </TouchableOpacity>
        </Popup>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendar: {
    flex: 1,
  },
  click: {
    flex: 1,
    backgroundColor: '#f9dbe7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clickWord: {
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: '迷你简丫丫',
  },
  pp: {
    height: 64,
    backgroundColor: '#f199bc',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  ppWord: {
    fontSize: 28,
    fontFamily: '迷你简丫丫',
  },
  addtion: {
    height: 50,
    backgroundColor: '#f9dbe7',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
});

export default SignIn;
