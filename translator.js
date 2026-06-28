/**
 * 本地翻译器 — 不依赖外部API
 * 策略：术语字典替换 + 标题保留原文，附带中文摘要
 * 适合离线场景，翻译质量够用
 */

// 机器人行业术语词典
const DICT = {
    // 产品/公司
    'humanoid': '人形机器人', 'humanoid robot': '人形机器人', 'bipedal': '双足',
    'robot': '机器人', 'robots': '机器人', 'robotic': '机器人',
    'drone': '无人机', 'uav': '无人机', 'aerial': '空中',
    'cobot': '协作机器人', 'collaborative robot': '协作机器人',
    'quadruped': '四足机器人', 'quadrupedal': '四足',
    'exoskeleton': '外骨骼',
    'prosthetic': '假肢', 'prosthetics': '假肢',
    'gripper': '夹爪', 'end effector': '末端执行器',
    'actuator': '执行器', 'servo': '伺服', 'motor': '电机',
    'sensor': '传感器', 'lidar': '激光雷达',
    'reducer': '减速器', 'harmonic': '谐波',
    'manipulator': '机械臂', 'arm': '机械臂',
    
    // 领域
    'embodied': '具身智能', 'embodiment': '具身',
    'physical ai': '物理AI', 'artificial intelligence': '人工智能',
    'foundation model': '基础模型', 'large language model': '大语言模型',
    'machine learning': '机器学习', 'deep learning': '深度学习',
    'reinforcement learning': '强化学习',
    'computer vision': '计算机视觉',
    'vision-language-action': '视觉-语言-动作',
    
    // 动作
    'launches': '发布', 'launch': '发布', 'unveils': '揭晓', 'unveiled': '揭晓',
    'announces': '宣布', 'announced': '宣布',
    'deploys': '部署', 'deployed': '部署', 'deployment': '部署',
    'introduces': '推出', 'introduced': '推出',
    'releases': '发布', 'released': '发布',
    'demonstrates': '演示', 'demonstrated': '演示',
    'ships': '出货', 'shipping': '出货',
    'expands': '扩展', 'expanding': '扩展',
    
    // 场景
    'factory': '工厂', 'manufacturing': '制造', 'production': '生产',
    'assembly': '装配', 'welding': '焊接', 'painting': '喷涂',
    'logistics': '物流', 'warehouse': '仓库',
    'surgical': '手术', 'medical': '医疗', 'hospital': '医院',
    'delivery': '配送', 'cleaning': '清洁',
    'agriculture': '农业', 'farming': '农业',
    'construction': '建筑', 'mining': '采矿',
    'inspection': '巡检', 'maintenance': '维护',
    
    // 公司/产品
    'tesla': '特斯拉', 'optimus': 'Optimus',
    'boston dynamics': '波士顿动力', 'atlas': 'Atlas',
    'figure': 'Figure', 'figure 03': 'Figure 03',
    'unitree': '宇树', 'g1': 'G1',
    'ubtech': '优必选', 'walker': 'Walker',
    ' Agility Robotics': 'Agility Robotics', 'digit': 'Digit',
    'waymo': 'Waymo', 'tesla bot': '特斯拉机器人',
    'sanctuary ai': 'Sanctuary AI', 'apollo': 'Apollo',
    'apptronik': 'Apptronik', 'apollo': 'Apollo',
    
    // 其他
    'funding': '融资', 'investment': '投资', 'ipo': '上市',
    'valuation': '估值', 'raises': '筹集',
    'partnership': '合作', 'collaboration': '合作',
    'policy': '政策', 'regulation': '法规',
    'market': '市场', 'industry': '行业',
    'paper': '论文', 'research': '研究',
    'dataset': '数据集', 'benchmark': '基准测试',
    'open source': '开源', 'framework': '框架',
    'safety': '安全', 'fenceless': '无围栏',
    'autonomous': '自主', 'autonomy': '自主性',
    'navigation': '导航', 'mapping': '建图',
    'grasping': '抓取', 'manipulation': '操作',
    'locomotion': '运动', 'mobility': '移动性',
    'perception': '感知', 'planning': '规划',
    'control': '控制', 'learning': '学习',
    'simulation': '仿真', 'simulator': '仿真器',
    'training': '训练', 'inference': '推理',
    'battery': '电池', 'power': '动力',
    'smart factory': '智能工厂', 'smart manufacturing': '智能制造',
    'industry 4.0': '工业4.0',
    'supply chain': '供应链',
};

function translateLocal(text) {
    if (!text) return text;
    let result = text;
    // 按词组长度降序替换（长词优先）
    const keys = Object.keys(DICT).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        const regex = new RegExp(key, 'gi');
        result = result.replace(regex, DICT[key]);
    }
    return result;
}

module.exports = { translateLocal };
