import { DEFAULT_INPUTS, type PlanInputs } from './model';

/** `载入演示案例` — values and copy are lifted from platform.js verbatim. */
export const DEMO_INPUTS: PlanInputs = {
  ...DEFAULT_INPUTS,
  theme: '岐江边的城市记忆读书会',
  audience: '青年读者',
  notes: '预置案例用于操作演示，场地、日期与物料仍需核实。',
};

export const DEMO_CONTENT = `# 岐江边的城市记忆读书会

## 一、活动定位
拟面向青年读者，以工业旧楼活化与岐江空间记忆为阅读讨论方向。此为预置流程示例，并非已举办活动。

## 二、90分钟流程
导入10分钟；空间资料共读20分钟；安静阅读20分钟；小组讨论30分钟；记录感悟与收尾10分钟。

## 三、主持提纲
从可确认的空间故事进入讨论，每位参与者分享一个观察与一个阅读问题。

## 四、物料与分工
主持、资料审核和现场协调各由工作人员确认。阅读材料、座位与设备待核实。

## 五、预算估算
资料打印20份×2元=40元；书签20份×3元=60元；预计100元。价格为演示估算，不代表真实采购报价。其他费用需核实，预算上限500元。

## 六、延伸阅读
由馆方核实城市更新与中山地方文化方向书目。阅读后记录一句感悟。

## 七、宣传方向
以“在岐江边读懂一段城市记忆”为主题，时间与报名信息待确认。

## 八、人工审核
核对空间故事、场地、预算、安全和对外信息。`;

export const EXAMPLE_REQUEST = {
  library: 'grid',
  theme: '岐江边的城市记忆读书会',
  audience: '青年读者',
  participants: '20',
  duration: '90',
  budget: '500',
  notes: '安排安静阅读与讨论时段，活动结束留下一句阅读感悟。场地及活动日期待确认。',
} as const;
