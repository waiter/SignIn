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


const signKey = 'signDatas';

class SignIn extends BindComponent {
  constructor(props) {
    super(props, ['initData', 'saveData', 'makeNoteAndAction', 'addTimer', 'resumeCheck', 'isTodayIn', 'reRender', 'saveNewData']);
    this.state = {
      datas: [],
      isInit: false,
      isSaving: false,
      resume: 1,
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
      if (this.isTodayIn()) {
        Alert.alert('你确定吗？', '要取消打卡吗？',
        [{text: '不取消'},
        {text: '确定！', onPress: () => {
          const newO = Object.assign([], this.state.datas);
          newO.splice(newO.indexOf(today), 1);
          this.saveNewData(newO);
        }}]);
      } else {
        Alert.alert('你确定吗？', '要打卡了？？', [{text: '不打'},
        {text: '确定！', onPress: () => {
          Alert.alert('真得确定吗？', '真的看足半个小时的Python了吗？', [{text: '哦！'},
          {text: '我看了！真的看了！你不相信我！我不理你了！', onPress: () => {
            const newO = Object.assign([], this.state.datas);
            newO.push(today);
            this.saveNewData(newO);
          }}]);
        }}]);
      }
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

  render() {
    const {isInit, datas, isSaving} = this.state;
    const [note, active, len] = this.makeNoteAndAction(datas);
    let word = '打卡';
    if (!isInit) {
      word = '读取数据中...';
    } else if (isSaving) {
      word = '保存中...';
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
  }
});

export default SignIn;
