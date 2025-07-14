// 全局变量，保存座位和人名信息
let seatData = [];
let nameList = [];
let editMode = false;
let chairIconUnmarked = localStorage.getItem('chairIconUnmarked') || '🪑'; // 未标记时的椅子emoji或图片URL
let chairIconMarked = localStorage.getItem('chairIconMarked') || '✅';   // 标记时的椅子emoji或图片URL (默认一个不同的 emoji)
let selectedSeatIndex = null; // 当前选中的座位index
let editModeType = 'drag'; // 'drag' 或 'rotate'
let mainTitle = '座序图';
let mainTitleColor = '#000000'; // 默认黑色
let mainTitleFontSize = '2em';   // 默认字号 (与h1初始一致，后续可以是px)
let mainTitleOpacity = 1.0;      // 默认不透明

let screenBg = '#f5f5f5'; // 恢复 screenBg
let screenOpacity = 1.0; // 添加屏幕透明度变量
let headerBackground = ''; // 存储标题背景图 Data URL

// !! 新增：名字样式变量 !!
let nameTextColorUnmarked = '#000000'; // 未标记时名字颜色，默认为黑色
let nameTextOpacityUnmarked = 1.0;    // 未标记时名字透明度
let nameTextColorMarked = '#000000';   // 标记时名字颜色，默认为黑色 (用户可以自定义)
let nameTextOpacityMarked = 1.0;      // 标记时名字透明度

// !! 新增：副标题相关变量 !!
let subTitle = ''; // 副标题文本，默认为空
let showSubTitle = false; // 是否显示副标题，默认不显示
let subTitleColor = '#555555'; // 副标题颜色，默认灰色
let subTitleFontSize = '1em'; // 副标题字号
let subTitleOpacity = 1.0; // 副标题透明度

const GRID_COLS = 10; // 修改为 10 列 (9座位 + 1屏幕)
const GRID_ROWS = 17; // 修改为 17 行
const GRID_TOTAL = GRID_COLS * GRID_ROWS; // 重新计算总数 (10*17=170)

// 检查最后一行的特殊处理
function isLastRow(row) {
    return row === GRID_ROWS - 1; // 如果是最后一行（索引16）则返回true
}

// ---- 恢复绘桌相关变量和功能 ----
let tableDrawMode = false; 
let tableColor = '#e1f5fe'; 
let tableOpacity = 1;      
let tablePattern = 'solid'; 
let filledCells = []; // 现在存储 {row, col, color, opacity, pattern}

// --- 移除纹理相关变量 ---
// ...

// Helper: 将 hex 和 opacity 转为 rgba
function colorToRgba(hex, alpha) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) hex = '#ffffff'; // Default to white if invalid
    alpha = parseFloat(alpha);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) alpha = 1;

    let r = parseInt(hex.substring(1, 3), 16) || 0;
    let g = parseInt(hex.substring(3, 5), 16) || 0;
    let b = parseInt(hex.substring(5, 7), 16) || 0;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 从localStorage加载数据 (需要适配新的 filledCells 格式)
function loadData(callback) {
    console.log('[loadData] 开始加载数据...');
    const savedData = localStorage.getItem('seatSystemData');
    console.log('[loadData] 从 localStorage 读取 seatSystemData:', savedData);
    chairIconUnmarked = localStorage.getItem('chairIconUnmarked') || '🪑';
    chairIconMarked = localStorage.getItem('chairIconMarked') || '✅';
    
    if (savedData) {
        try {
            console.log('[loadData] 尝试解析 seatSystemData...');
            const data = JSON.parse(savedData);
            console.log('[loadData] 解析成功:', data);
            seatData = data.seatData || [];
            nameList = data.nameList || [];
            mainTitle = data.mainTitle || '座序图';
            mainTitleColor = data.mainTitleColor || '#000000';
            mainTitleFontSize = data.mainTitleFontSize || '32px'; // 假设默认2em约等于32px
            mainTitleOpacity = data.mainTitleOpacity === undefined ? 1.0 : data.mainTitleOpacity;
            screenBg = data.screenBg || '#f5f5f5'; 
            screenOpacity = data.screenOpacity === undefined ? 1.0 : data.screenOpacity;
            headerBackground = data.headerBackground || ''; 
            
            // 加载副标题数据 !!
            subTitle = data.subTitle || '';
            showSubTitle = data.showSubTitle === undefined ? false : data.showSubTitle;
            subTitleColor = data.subTitleColor || '#555555';
            subTitleFontSize = data.subTitleFontSize || '16px'; // 假设默认1em约等于16px
            subTitleOpacity = data.subTitleOpacity === undefined ? 1.0 : data.subTitleOpacity;
            
            // 加载桌子数据
            tableColor = data.tableColor || '#e1f5fe';
            tableOpacity = data.tableOpacity === undefined ? 1 : data.tableOpacity; // 处理旧数据可能没有透明度
            tablePattern = data.tablePattern || 'solid';
            
            // 适配 filledCells 数据格式
            filledCells = (data.filledCells || []).map(cell => {
                if (typeof cell === 'object' && cell !== null && cell.hasOwnProperty('row') && cell.hasOwnProperty('col')) {
                     // 如果是新格式或兼容格式，确保有默认值
                    return {
                        row: cell.row,
                        col: cell.col,
                        color: cell.color || tableColor,
                        opacity: cell.opacity === undefined ? 1 : cell.opacity,
                        pattern: cell.pattern || tablePattern
                    };
                }
                // 忽略无法识别的旧格式数据
                return null; 
            }).filter(cell => cell !== null); // 过滤掉无效数据
            
            // !! 加载标记覆盖层设置
            markOverlayColor = data.markOverlayColor || '#ff0000';
            markOverlayOpacity = data.markOverlayOpacity === undefined ? 0.4 : data.markOverlayOpacity;
            
            // !! 加载名字样式 !!
            nameTextColorUnmarked = data.nameTextColorUnmarked || '#000000';
            nameTextOpacityUnmarked = data.nameTextOpacityUnmarked === undefined ? 1.0 : data.nameTextOpacityUnmarked;
            nameTextColorMarked = data.nameTextColorMarked || '#000000';
            nameTextOpacityMarked = data.nameTextOpacityMarked === undefined ? 1.0 : data.nameTextOpacityMarked;
            
            // !! 添加日志: 打印加载到的值
            console.log(`[loadData] 加载到的标记样式: color=${markOverlayColor}, opacity=${markOverlayOpacity}`);
            console.log(`[loadData] 加载到的名字样式 (未标记): color=${nameTextColorUnmarked}, opacity=${nameTextOpacityUnmarked}`);
            console.log(`[loadData] 加载到的名字样式 (标记): color=${nameTextColorMarked}, opacity=${nameTextOpacityMarked}`);
            
            console.log('[loadData] 使用localStorage数据恢复状态完成。');
            if (callback) callback();
            return; 
        } catch (e) {
            console.error('[loadData] 从localStorage加载数据失败 (JSON解析错误?):', e);
        }
    }

    // 默认值
    console.log('[loadData] 未找到有效数据或加载失败，使用默认值初始化状态。');
    seatData = []; nameList = []; mainTitle = '座序图';
    mainTitleColor = '#000000';
    mainTitleFontSize = '32px'; // 假设默认2em约等于32px, 保存时统一为px
    mainTitleOpacity = 1.0;

    // !! 设置副标题默认值 !!
    subTitle = ''; 
    showSubTitle = false;
    subTitleColor = '#555555';
    subTitleFontSize = '16px';
    subTitleOpacity = 1.0;

    screenBg = '#f5f5f5'; 
    screenOpacity = 1.0; // 设置默认透明度
    headerBackground = ''; tableColor = '#e1f5fe'; tableOpacity = 1;
    tablePattern = 'solid'; filledCells = [];
    // !! 设置标记覆盖层默认值
    markOverlayColor = '#ff0000';
    markOverlayOpacity = 0.4;
    // !! 设置名字样式默认值 !!
    nameTextColorUnmarked = '#000000';
    nameTextOpacityUnmarked = 1.0;
    nameTextColorMarked = '#000000';
    nameTextOpacityMarked = 1.0;
    console.log(`[loadData] 使用默认标记样式: color=${markOverlayColor}, opacity=${markOverlayOpacity}`);
    console.log(`[loadData] 使用默认名字样式。`);
    // !! 设置新图标变量的默认值 (如果localStorage中没有)
    chairIconUnmarked = localStorage.getItem('chairIconUnmarked') || '🪑'; 
    chairIconMarked = localStorage.getItem('chairIconMarked') || '✅';
    console.log(`[loadData] 使用默认椅子图标: unmarked=${chairIconUnmarked}, marked=${chairIconMarked}`);
    if (callback) callback();
}

// 保存数据到本地存储 (确保保存新格式)
function saveData() {
    console.log('[saveData] 开始保存数据...');
    const dataToSave = { 
        seatData, nameList, mainTitle, 
        mainTitleColor, mainTitleFontSize, mainTitleOpacity, // 保存主标题样式
        screenBg,
        screenOpacity,
        // !! 保存副标题数据 !!
        subTitle, showSubTitle, subTitleColor, subTitleFontSize, subTitleOpacity,
        tableColor, tableOpacity, tablePattern, filledCells, // 保存绘桌数据
        headerBackground,
        // !! 保存标记覆盖层设置
        markOverlayColor, markOverlayOpacity,
        // !! 保存名字样式 !!
        nameTextColorUnmarked, nameTextOpacityUnmarked,
        nameTextColorMarked, nameTextOpacityMarked,
        // !! 保存新的图标变量 !!
        chairIconUnmarked, chairIconMarked
    };
    console.log('[saveData] 准备保存的数据:', dataToSave);
    
    try {
        const jsonData = JSON.stringify(dataToSave);
        console.log('[saveData] JSON 序列化成功:', jsonData);
        localStorage.setItem('seatSystemData', jsonData);
        localStorage.setItem('chairIconUnmarked', chairIconUnmarked);
        localStorage.setItem('chairIconMarked', chairIconMarked);
        console.log('[saveData] 数据已写入 localStorage。');
    } catch (e) {
        console.error('[saveData] 保存到 localStorage 失败:', e);
    }
    
    const saveStatus = document.getElementById('saveStatus');
    if (saveStatus) { // 检查元素是否存在
        saveStatus.style.display = 'block';
        setTimeout(() => { saveStatus.style.display = 'none'; }, 2000);
    }
}

// 导出设置为文件
function exportSettings() {
    const dataToExport = { 
        seatData, 
        nameList, 
        mainTitle, 
        mainTitleColor, mainTitleFontSize, mainTitleOpacity, // 导出主标题样式
        screenBg,
        screenOpacity,
        // !! 导出副标题数据 !!
        subTitle, showSubTitle, subTitleColor, subTitleFontSize, subTitleOpacity,
        tableColor,
        tableOpacity,
        tablePattern,
        filledCells,
        chairIconUnmarked,
        chairIconMarked,
        headerBackground,
        // !! 导出标记覆盖层设置
        markOverlayColor, markOverlayOpacity,
        // !! 导出名字样式 !!
        nameTextColorUnmarked, nameTextOpacityUnmarked,
        nameTextColorMarked, nameTextOpacityMarked,
        // !! 导出新的图标变量 !!
        chairIconUnmarked, chairIconMarked
    };
    
    // 转换为可读性更好的纯文本格式
    let textContent = `座序图设置导出 - ${new Date().toLocaleString()}\n`;
    textContent += `==========================================\n`;
    textContent += `主标题: ${mainTitle}\n`;
    textContent += `主标题颜色: ${mainTitleColor}\n`;
    textContent += `主标题字号: ${mainTitleFontSize}\n`;
    textContent += `主标题透明度: ${mainTitleOpacity}\n`;
    textContent += `副标题: ${showSubTitle ? subTitle : '未显示'}\n`;
    if (showSubTitle) {
        textContent += `副标题颜色: ${subTitleColor}\n`;
        textContent += `副标题字号: ${subTitleFontSize}\n`;
        textContent += `副标题透明度: ${subTitleOpacity}\n`;
    }
    textContent += `大屏幕颜色: ${screenBg}\n`;
    textContent += `大屏幕透明度: ${screenOpacity}\n`;
    textContent += `标记覆盖颜色: ${markOverlayColor}\n`;
    textContent += `标记覆盖透明度: ${markOverlayOpacity}\n`;
    textContent += `名字颜色(未标记): ${nameTextColorUnmarked} (透明度: ${nameTextOpacityUnmarked})\n`;
    textContent += `名字颜色(标记): ${nameTextColorMarked} (透明度: ${nameTextOpacityMarked})\n`;
    textContent += `椅子图标(未标记): ${chairIconUnmarked.startsWith('data:') ? '[自定义图片]' : chairIconUnmarked}\n`;
    textContent += `椅子图标(标记): ${chairIconMarked.startsWith('data:') ? '[自定义图片]' : chairIconMarked}\n`;
    textContent += `桌子颜色: ${tableColor}\n`;
    textContent += `桌子透明度: ${tableOpacity}\n`;
    textContent += `桌子纹理: ${tablePattern}\n`;
    textContent += `人名列表: ${nameList.join(', ')}\n`;
    textContent += `座位数据: ${seatData.length}个\n`;
    textContent += `桌子单元格: ${filledCells.length}个\n`;
    textContent += `==========================================\n`;
    textContent += `完整数据备份(请勿修改此部分):\n`;
    textContent += JSON.stringify(dataToExport);
    
    // 创建Blob对象
    const blob = new Blob([textContent], {type: 'text/plain'});
    
    // 创建下载链接
    const a = document.createElement('a');
    a.download = `座序图设置_${new Date().toISOString().split('T')[0]}.txt`;
    a.href = URL.createObjectURL(blob);
    
    // 添加到文档并触发点击
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// 导入设置从文件
function importSettings(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // 查找JSON数据的开始位置
            const content = e.target.result;
            const jsonStartIndex = content.indexOf('{"seatData"');
            
            // 如果找不到JSON数据，尝试直接解析整个内容
            const jsonStr = jsonStartIndex >= 0 ? content.substring(jsonStartIndex) : content;
            const data = JSON.parse(jsonStr);
            
            // 导入所有数据
            seatData = data.seatData || [];
            nameList = data.nameList || [];
            mainTitle = data.mainTitle || '座序图';
            mainTitleColor = data.mainTitleColor || '#000000';
            mainTitleFontSize = data.mainTitleFontSize || '32px';
            mainTitleOpacity = data.mainTitleOpacity === undefined ? 1.0 : data.mainTitleOpacity;
            screenBg = data.screenBg || '#f5f5f5'; 
            screenOpacity = data.screenOpacity === undefined ? 1.0 : data.screenOpacity;
            headerBackground = data.headerBackground || ''; // 加载标题背景图
            
            // 加载副标题数据 !!
            subTitle = data.subTitle || '';
            showSubTitle = data.showSubTitle === undefined ? false : data.showSubTitle;
            subTitleColor = data.subTitleColor || '#555555';
            subTitleFontSize = data.subTitleFontSize || '16px';
            subTitleOpacity = data.subTitleOpacity === undefined ? 1.0 : data.subTitleOpacity;
            
            // 加载桌子数据
            tableColor = data.tableColor || '#e1f5fe';
            tableOpacity = data.tableOpacity || 1;
            tablePattern = data.tablePattern || 'solid';
            
            // 处理filledCells数据，确保每个单元格都有颜色属性
            filledCells = (data.filledCells || []).map(cell => {
                // 如果是旧数据格式，没有颜色属性，则添加默认值
                if (!cell.color) {
                    return {
                        ...cell,
                        color: tableColor,
                        opacity: tableOpacity,
                        pattern: tablePattern
                    };
                }
                return cell;
            });
            
            // !! 导入新的图标变量 !!
            chairIconUnmarked = data.chairIconUnmarked || '🪑';
            chairIconMarked = data.chairIconMarked || '✅';
            localStorage.setItem('chairIconUnmarked', chairIconUnmarked);
            localStorage.setItem('chairIconMarked', chairIconMarked);
            
            // !! 导入标记覆盖层设置
            markOverlayColor = data.markOverlayColor || '#ff0000';
            markOverlayOpacity = data.markOverlayOpacity === undefined ? 0.4 : data.markOverlayOpacity;
            
            // !! 导入名字样式 !!
            nameTextColorUnmarked = data.nameTextColorUnmarked || '#000000';
            nameTextOpacityUnmarked = data.nameTextOpacityUnmarked === undefined ? 1.0 : data.nameTextOpacityUnmarked;
            nameTextColorMarked = data.nameTextColorMarked || '#000000';
            nameTextOpacityMarked = data.nameTextOpacityMarked === undefined ? 1.0 : data.nameTextOpacityMarked;
            
            // 保存到localStorage
            saveData();
            
            // 重新渲染
            renderGrid();
            renderTitles();
            updateEditButtonAppearance(); // 确保导入后按钮状态正确
            
            // 显示提示
            alert('导入成功！');
        } catch (e) {
            console.error('导入失败:', e);
            alert('导入失败，文件格式不正确！');
        }
    };
    reader.readAsText(file);
}

// 应用标题背景图
function applyHeaderBackground() {
    const header = document.querySelector('header');
    if (header) {
        if (headerBackground) {
            header.style.backgroundImage = `url(${headerBackground})`;
        } else {
            header.style.backgroundImage = 'none'; // 清除背景
        }
    }
}

// 处理标题背景图文件选择
function handleTitleBgChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { 
        alert('请选择图片文件！');
        return; 
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        headerBackground = e.target.result;
        applyHeaderBackground();
        saveData();
    }
    reader.readAsDataURL(file);
    event.target.value = null;
}

// 删除标题背景图
function deleteHeaderBackground() {
    headerBackground = '';
    applyHeaderBackground();
    saveData();
}

// 初始化页面
window.onload = function() {
    // 创建导出/导入按钮
    const exportBtn = document.createElement('button');
    exportBtn.id = 'exportBtn';
    exportBtn.textContent = '导出配置';
    exportBtn.style.position = 'fixed';
    exportBtn.style.bottom = '10px';
    exportBtn.style.right = '10px';
    exportBtn.style.padding = '5px 10px';
    exportBtn.style.background = '#2196F3';
    exportBtn.style.color = 'white';
    exportBtn.style.border = 'none';
    exportBtn.style.borderRadius = '4px';
    exportBtn.style.cursor = 'pointer';
    exportBtn.style.display = 'none'; // 默认隐藏
    exportBtn.onclick = exportSettings;
    document.body.appendChild(exportBtn);
    
    // 创建导入按钮和隐藏的file input
    const importBtn = document.createElement('button');
    importBtn.id = 'importBtn';
    importBtn.textContent = '导入配置';
    importBtn.style.position = 'fixed';
    importBtn.style.bottom = '10px';
    importBtn.style.right = '110px';
    importBtn.style.padding = '5px 10px';
    importBtn.style.background = '#FF9800';
    importBtn.style.color = 'white';
    importBtn.style.border = 'none';
    importBtn.style.borderRadius = '4px';
    importBtn.style.cursor = 'pointer';
    importBtn.style.display = 'none'; // 默认隐藏
    document.body.appendChild(importBtn);
    
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.id = 'importInput';
    importInput.accept = '.txt,.json';
    importInput.style.display = 'none';
    document.body.appendChild(importInput);
    
    importBtn.onclick = function() {
        importInput.click();
    };
    
    importInput.onchange = function(e) {
        if (e.target.files.length > 0) {
            importSettings(e.target.files[0]);
        }
    };
    
    // !! 恢复绘桌按钮的引用
    const drawTableBtn = document.getElementById('drawTableBtn'); 
    
    loadData(() => {
        // !! 在绑定事件和渲染前，先根据加载的数据设置按钮初始外观 !!
        updateEditButtonAppearance(); 
        
        bindEvents();
        renderGrid();
        applyHeaderBackground(); 
        renderTitles();
    });
}

// 渲染座位表格
function renderGrid() {
    const grid = document.getElementById('seatingGrid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.setProperty('--screen-bg', screenBg);

    const markConfigBtn = document.getElementById('markConfigBtn'); // 获取按钮引用

    if (editMode) {
        grid.classList.add('edit-mode');
        
        const iconTools = document.getElementById('iconTools');
        if (iconTools) iconTools.style.display = 'inline-flex';
        
        const controlGroup = document.querySelector('.control-buttons-group');
        if (controlGroup) controlGroup.style.display = 'flex'; 
        
        const dragModeBtn = document.getElementById('dragModeBtn');
        const rotateModeBtn = document.getElementById('rotateModeBtn');
        const chairIconBtn = document.getElementById('chairIconBtn');
        const chairIconMarkedBtn = document.getElementById('chairIconMarkedBtn'); // 获取标记图标按钮
        const rotateTools = document.getElementById('rotateTools');
        const nameConfigBtn = document.getElementById('nameConfigBtn'); // 获取新按钮
        const markAndNameButtonsRow = document.getElementById('markAndNameButtonsRow'); // 获取"标"和"名"的父容器
        const editTitleBtnOnTitle = document.querySelector('.title-block #editTitleBtn'); // 更精确获取标题旁的编辑按钮

        // 控制按钮的显示和激活状态
        if (dragModeBtn) dragModeBtn.classList.toggle('active', editModeType === 'drag');
        if (rotateModeBtn) rotateModeBtn.classList.toggle('active', editModeType === 'rotate');
        if (rotateTools) rotateTools.style.display = editModeType === 'rotate' ? 'flex' : 'none';
        if (editTitleBtnOnTitle) editTitleBtnOnTitle.style.display = 'inline-block'; // 编辑模式下确保标题旁的编辑按钮显示

        if (editModeType === 'drag') {
            if (chairIconBtn) {
                chairIconBtn.style.display = 'inline-block'; 
            }
            if (chairIconMarkedBtn) { // 控制标记图标按钮的显示
                chairIconMarkedBtn.style.display = 'inline-block';
            }
            if (markAndNameButtonsRow) {
                markAndNameButtonsRow.style.display = 'flex'; 
            }

            let baseSizePx = '16px'; // Default determined by your HTML for markConfigBtn (16px)
            // Attempt to get a dynamic size from chairIconBtn if needed, but seems your HTML has fixed sizes for mini-btns
            // For simplicity, we'll use the fixed size from your HTML for mark/name buttons.

            // 标记按钮 ("标")
            if (markConfigBtn) {
                markConfigBtn.style.display = 'inline-block'; 
                markConfigBtn.style.width = baseSizePx;
                markConfigBtn.style.height = baseSizePx;
                markConfigBtn.style.boxSizing = 'border-box';
                markConfigBtn.style.padding = '0';
                markConfigBtn.style.lineHeight = baseSizePx;
                markConfigBtn.style.textAlign = 'center';
                // margin-right is handled by `gap` in `markAndNameButtonsRow` or can be added if `gap` is not supported/used
            }

            // 名字按钮 ("名") - Apply identical styling
            if (nameConfigBtn) {
                nameConfigBtn.style.display = 'inline-block';
                nameConfigBtn.style.width = baseSizePx;
                nameConfigBtn.style.height = baseSizePx;
                nameConfigBtn.style.boxSizing = 'border-box';
                nameConfigBtn.style.padding = '0';
                nameConfigBtn.style.lineHeight = baseSizePx;
                nameConfigBtn.style.textAlign = 'center';
            }

        } else if (editModeType === 'rotate') {
            if (chairIconBtn) chairIconBtn.style.display = 'none'; 
            if (chairIconMarkedBtn) chairIconMarkedBtn.style.display = 'none'; // 旋转模式下隐藏标记图标按钮
            if (markAndNameButtonsRow) markAndNameButtonsRow.style.display = 'none'; // Hide the row

        } else { // 绘桌模式或未知模式 (editModeType === 'none' for tableDrawMode)
            if (chairIconBtn) chairIconBtn.style.display = 'none';
            if (chairIconMarkedBtn) chairIconMarkedBtn.style.display = 'none'; // 其他模式也隐藏
            if (markAndNameButtonsRow) markAndNameButtonsRow.style.display = 'none'; // Hide the row
        }
        
    } else {
        grid.classList.remove('edit-mode');
        
        const iconTools = document.getElementById('iconTools');
        const controlGroup = document.querySelector('.control-buttons-group');
        const manageBtn = document.getElementById('manageBtn');
        const changeTitleBgBtn = document.getElementById('changeTitleBgBtn');
        const deleteTitleBgBtn = document.getElementById('deleteTitleBgBtn');
        // const headerCenter = document.getElementById('headerCenter'); // 这行可能不需要了
        const editTitleBtn = document.getElementById('editTitleBtn'); // toolbar 里的总编辑按钮
        const editTitleBtnOnTitle = document.querySelector('.title-block #editTitleBtn'); // 标题旁的编辑按钮

        // !! 恢复绘桌按钮的引用
        const drawTableBtn = document.getElementById('drawTableBtn');
        
        if (iconTools) iconTools.style.display = 'none';
        if (controlGroup) controlGroup.style.display = 'none';
        if (manageBtn) manageBtn.style.display = 'none';
        if (changeTitleBgBtn) changeTitleBgBtn.style.display = 'none';
        if (deleteTitleBgBtn) deleteTitleBgBtn.style.display = 'none';
        if (editTitleBtnOnTitle) editTitleBtnOnTitle.style.display = 'none'; // 非编辑模式隐藏标题旁的编辑按钮

        // !! 恢复绘桌按钮的隐藏逻辑
        if (drawTableBtn) drawTableBtn.style.display = 'none';
        
        // !! 恢复绘桌模式相关的状态清除和UI隐藏
        tableDrawMode = false; 
        const tableControls = document.querySelector('.table-controls');
        if (tableControls) {
            tableControls.remove();
        }
        
        selectedSeatIndex = null;
        // !! 非编辑模式下，移除所有控制面板
        document.querySelectorAll('.screen-controls, .mark-controls').forEach(el => el.remove());
        if (markConfigBtn) markConfigBtn.style.display = 'none'; // 隐藏标记按钮
    }
    
    // !! 日志更新
    console.log(`[renderGrid] 开始渲染 (编辑模式: ${editMode}). Current mark style: color=${markOverlayColor}, opacity=${markOverlayOpacity}`);

    // 渲染座位
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const idx = row * GRID_COLS + col;
            const seat = document.createElement('div');
            seat.className = 'seat';
            seat.dataset.index = idx;
            seat.dataset.row = row;
            seat.dataset.col = col;

            // 清除旧的覆盖层
            const existingOverlay = seat.querySelector('.mark-overlay');
            if (existingOverlay) existingOverlay.remove();

            if (col === 9) { // 处理第 10 列屏幕 (索引9)
                // 考虑到总行数增加到17 (索引0-16)
                // 我们需要重新定义屏幕的上下边界和文字位置
                // 假设屏幕大致在中间部分，比如从第3行(索引2)到第14行(索引13)
                const screenStartRow = 2; 
                const screenEndRow = GRID_ROWS - 3; // 假设上下各留2行非屏幕区

                if (row >= screenStartRow && row <= screenEndRow) {
                    seat.style.backgroundColor = colorToRgba(screenBg, screenOpacity); 
                    seat.classList.remove('table-filled', 'marked');
                    seat.innerHTML = ''; 

                    // 添加文字到特定行, 基于新的17行布局调整
                    // 假设中间三行是 GRID_ROWS/2 - 1, GRID_ROWS/2, GRID_ROWS/2 + 1 (取整)
                    const middleRowApprox = Math.floor(GRID_ROWS / 2);
                    if (row === middleRowApprox - 1) { 
                        seat.innerHTML = '<span class="screen-char align-top">大</span>';
                    } else if (row === middleRowApprox) { 
                        seat.innerHTML = '<span class="screen-char align-middle">屏</span>';
                    } else if (row === middleRowApprox + 1) { 
                        seat.innerHTML = '<span class="screen-char align-bottom">幕</span>';
                    }
                    
                    // !! 在编辑模式下为这些格子添加点击事件
                    if (editMode) {
                        seat.onclick = (e) => {
                            e.stopPropagation(); // 防止触发 grid 的点击事件
                            showScreenControls();
                        };
                    } else {
                        seat.onclick = null; // 非编辑模式移除点击
                    }

                } else {
                    // 第 10 列的其他行 (行 0, 1, 13, 14)
                    seat.innerHTML = ''; // 确保是空的
                    seat.style.background = ''; // 确保无特殊背景
                    seat.onclick = null; // 确保非功能区不可点击
                }
            } else { // 处理前 9 列座位
                 const person = seatData.find(s => s.index === idx);
                 const filledCell = filledCells.find(cell => cell.row === row && cell.col === col);

                 // 确保移除之前的标记类和卡片类，以防状态不一致
                 seat.classList.remove('marked', 'person-card');
                 seat.style.backgroundColor = ''; // 重置背景
                 seat.style.borderRadius = '';    // 重置圆角
                 seat.style.padding = '';         // 重置内边距
                 seat.style.boxShadow = '';       // 重置阴影

                 if (filledCell && !person) {
                      seat.classList.add('table-filled');
                      seat.style.background = applyTablePattern(
                          filledCell.color, filledCell.pattern, filledCell.opacity
                      );
                      if (editMode && tableDrawMode) {
                          seat.addEventListener('click', function(e) { e.stopPropagation(); toggleCellFill(row, col); });
                      }
                 } else if (editMode && tableDrawMode && !person) {
                     seat.addEventListener('click', function(e) { e.stopPropagation(); toggleCellFill(row, col); });
                 } else if (person) {
                     // !! 卡片化样式 !!
                     seat.classList.add('person-card'); // 用于CSS hover效果
                     seat.style.backgroundColor = 'white';
                     seat.style.borderRadius = '4px';
                     seat.style.padding = '2px';
                     seat.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
                     seat.style.overflow = 'hidden'; // 防止内容溢出卡片

                     let rotate = person.rotate || 0;
                     let flip = person.flip ? 'scaleX(-1)' : '';
                     let iconHtml = '';
                     // !! 图标调整：尝试让图标更大，减少固定边距 !!
                     let iconStyle = `display:flex; align-items:center; justify-content:center; width:90%; height:90%; transform: ${flip} rotate(${rotate}deg) scale(0.80);`; // MODIFIED: scale reduced for smaller cells
                     
                     let currentChairIcon = person.marked ? chairIconMarked : chairIconUnmarked;

                     if (currentChairIcon.startsWith('data:')) {
                         iconHtml = `<img src='${currentChairIcon}' class='icon-img' style='${iconStyle}' />`;
                     } else {
                         iconHtml = `<span class='icon-emoji' style='${iconStyle} font-size: 1.0em;'>${currentChairIcon}</span>`; // MODIFIED: emoji font-size reduced
                     }

                     // !! 名字样式调整：尝试让名字部分更突出，利用flex填充 !!
                     // nameDivStyle 的 font-size 和 line-height 可以在 style.css 中通过 .seat .name 来统一控制，这里主要确保颜色
                     let nameDivStyle = `font-weight: bold; padding: 0 1px; word-break: break-all; text-align: center; background-color: transparent; width: 100%;`; // 移除 font-size 和 line-height, 添加 width:100%
                     if (person.marked) {
                         nameDivStyle += `color: ${colorToRgba(nameTextColorMarked, nameTextOpacityMarked)};`;
                     } else {
                         nameDivStyle += `color: ${colorToRgba(nameTextColorUnmarked, nameTextOpacityUnmarked)};`;
                     }
                     // 使用 flex 布局让图标和名字更好地分配空间
                     seat.innerHTML = `<div class="icon" style="flex: 0.68; display:flex; align-items:center; justify-content:center;">${iconHtml}</div>
                                       <div class="name" style="${nameDivStyle} flex: 0.32; display:flex; align-items:center; justify-content:center;">${person.name}</div>`;
                     
                     // !! 标记覆盖层逻辑 (现在只覆盖图标和卡片背景，不影响名字颜色) !!
                     if (person.marked) {
                         seat.classList.add('marked'); 
                         const overlayColorForCard = colorToRgba(markOverlayColor, markOverlayOpacity * 0.5); // 降低覆盖层透明度，以免完全遮盖白色卡片
                         const overlay = document.createElement('div');
                         overlay.className = 'mark-overlay';
                         overlay.style.position = 'absolute';
                         overlay.style.top = '0';
                         overlay.style.left = '0';
                         overlay.style.width = '100%';
                         overlay.style.height = '100%';
                         overlay.style.backgroundColor = overlayColorForCard;
                         overlay.style.borderRadius = seat.style.borderRadius; // 保持与卡片一致的圆角
                         overlay.style.pointerEvents = 'none'; // 确保覆盖层不干扰点击
                         seat.insertBefore(overlay, seat.firstChild); // 插入在最底层，图标和名字之下
                         console.log(`  [renderGrid] Seat ${idx} marked. Applying card overlay. Style: ${overlayColorForCard}`);
                     } 
                 } else { // 空格子 (既不是 filledCell 也不是 person)
                     seat.innerHTML = '';
                     seat.style.background = '';
                 }

                 // 编辑模式下的选中状态 (这个可以在 if(person) 之外)
                 if (editMode && selectedSeatIndex === idx) {
                     seat.classList.add('selected');
                 }
             }
            grid.appendChild(seat);
        }
    }
    console.log('[renderGrid] 渲染完成。');

    // !! 恢复拖拽/旋转启用逻辑 (现在只影响前7列)
    if (editMode) {
        if (editModeType === 'drag') {
            enableDrag(); // enableDrag 内部逻辑需确认只处理 .seat
        } else if (editModeType === 'rotate') {
            enableRotateSelect(); // enableRotateSelect 内部逻辑需确认只处理 .seat
        } 
    }
}

// 渲染标题和副标题
function renderTitles() {
    const titleElement = document.getElementById('mainTitle');
    if (titleElement) {
        // 先找到文本节点并更新
        let textNode = null;
        for (let i = 0; i < titleElement.childNodes.length; i++) {
            if (titleElement.childNodes[i].nodeType === Node.TEXT_NODE) {
                textNode = titleElement.childNodes[i];
                break;
            }
        }
        if (textNode) {
            textNode.nodeValue = mainTitle + ' ';
        } else { // 如果没有文本节点 (例如第一次或被清空了)，创建一个
            titleElement.insertBefore(document.createTextNode(mainTitle + ' '), titleElement.firstChild);
        }

        // 应用样式
        titleElement.style.color = mainTitleColor;
        titleElement.style.fontSize = mainTitleFontSize; // 确保是带单位的字符串，如 '32px'
        titleElement.style.opacity = mainTitleOpacity;
    }

    // 副标题渲染
    const subTitleElement = document.getElementById('subTitle');
    if (subTitleElement) {
        if (showSubTitle && subTitle.trim() !== '') {
            subTitleElement.textContent = subTitle;
            subTitleElement.style.color = subTitleColor;
            subTitleElement.style.fontSize = subTitleFontSize;
            subTitleElement.style.opacity = subTitleOpacity;
            subTitleElement.style.display = 'block'; // 或 'inline' 根据需要
        } else {
            subTitleElement.style.display = 'none';
            subTitleElement.textContent = ''; // 清空内容以防意外显示
        }
    } else if (showSubTitle && subTitle.trim() !== '') {
        // 如果副标题元素不存在但需要显示，则创建它
        const newSubTitleElement = document.createElement('h2'); // 或者用p标签
        newSubTitleElement.id = 'subTitle';
        newSubTitleElement.textContent = subTitle;
        newSubTitleElement.style.color = subTitleColor;
        newSubTitleElement.style.fontSize = subTitleFontSize;
        newSubTitleElement.style.opacity = subTitleOpacity;
        // 插入到主标题之后，或 header-center 的其他合适位置
        const headerCenter = document.getElementById('headerCenter');
        const mainTitleH1 = document.getElementById('mainTitle');
        if (headerCenter && mainTitleH1) {
            // headerCenter.insertBefore(newSubTitleElement, mainTitleH1.nextSibling); // Original problematic line
            // Corrected logic:
            if (mainTitleH1.parentElement) {
                mainTitleH1.parentElement.insertBefore(newSubTitleElement, mainTitleH1.nextSibling);
            } else {
                // Fallback if mainTitleH1 somehow has no parent, append to headerCenter
                headerCenter.appendChild(newSubTitleElement);
                console.warn('SubTitle appended to headerCenter as a fallback because mainTitleH1.parentElement was not found.');
            }
        }
    }
}

// 绑定按钮和事件
function bindEvents() {
    document.getElementById('manageBtn').onclick = openManageModal;
    document.getElementById('editBtn').onclick = toggleEditMode;
    document.getElementById('changeTitleBgBtn').onclick = () => document.getElementById('titleBgInput').click();
    document.getElementById('deleteTitleBgBtn').onclick = deleteHeaderBackground; 
    document.getElementById('titleBgInput').onchange = handleTitleBgChange; 
    document.getElementById('closeModal').onclick = closeManageModal;
    document.getElementById('addNameBtn').onclick = addName;
    document.getElementById('saveNamesBtn').onclick = saveNames;
    document.getElementById('nameInput').onkeydown = function(e) {
        if (e.key === 'Enter') addName();
    };
    const drawTableBtn = document.getElementById('drawTableBtn');
    if(drawTableBtn) drawTableBtn.onclick = toggleTableDrawMode;
    
    const dragModeBtn = document.getElementById('dragModeBtn');
    const rotateModeBtn = document.getElementById('rotateModeBtn');
    // !! 恢复 chairIconBtn (更换图标按钮) 和 iconInput 的事件绑定
    const chairIconBtn = document.getElementById('chairIconBtn'); // 这个现在是未标记图标按钮
    const iconInput = document.getElementById('iconInput');       // 这个现在是未标记图标输入
    const chairIconMarkedBtn = document.getElementById('chairIconMarkedBtn'); // 新的标记图标按钮
    const iconInputMarked = document.getElementById('iconInputMarked');     // 新的标记图标输入

    if(chairIconBtn) chairIconBtn.onclick = () => iconInput.click();
    if(iconInput) iconInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                chairIconUnmarked = ev.target.result; // 保存 Data URL
                localStorage.setItem('chairIconUnmarked', chairIconUnmarked);
                saveData(); // 保存所有数据，包括新的图标
                renderGrid();
            }
            reader.readAsDataURL(file);
        } else if (file) {
            alert('请选择图片文件!');
        }
        e.target.value = null; // 清空 input，允许再次选择同文件
    };

    if(chairIconMarkedBtn) chairIconMarkedBtn.onclick = () => iconInputMarked.click();
    if(iconInputMarked) iconInputMarked.onchange = function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                chairIconMarked = ev.target.result; // 保存 Data URL
                localStorage.setItem('chairIconMarked', chairIconMarked);
                saveData(); // 保存所有数据，包括新的图标
                renderGrid();
            }
            reader.readAsDataURL(file);
        } else if (file) {
            alert('请选择图片文件!');
        }
        e.target.value = null; // 清空 input，允许再次选择同文件
    };

    if(dragModeBtn) dragModeBtn.onclick = function() {
        editModeType = 'drag';
        // !! 恢复绘桌相关的状态和UI更新
        tableDrawMode = false; 
        dragModeBtn.classList.add('active');
        if (rotateModeBtn) rotateModeBtn.classList.remove('active');
        if (drawTableBtn) drawTableBtn.classList.remove('active'); // 绘桌按钮取消激活
        const chairIconBtn = document.getElementById('chairIconBtn');
        const rotateTools = document.getElementById('rotateTools');
        if (chairIconBtn) chairIconBtn.style.display = 'inline';
        if (rotateTools) rotateTools.style.display = 'none';
        const existingControls = document.querySelector('.table-controls');
        if (existingControls) { existingControls.remove(); }
        renderGrid();
    };
    if(rotateModeBtn) rotateModeBtn.onclick = function() {
        editModeType = 'rotate';
        // !! 恢复绘桌相关的状态和UI更新
        tableDrawMode = false;
        if (dragModeBtn) dragModeBtn.classList.remove('active');
        rotateModeBtn.classList.add('active');
        if (drawTableBtn) drawTableBtn.classList.remove('active'); // 绘桌按钮取消激活
        const chairIconBtn = document.getElementById('chairIconBtn');
        const rotateTools = document.getElementById('rotateTools');
        if (chairIconBtn) chairIconBtn.style.display = 'none';
        if (rotateTools) rotateTools.style.display = 'flex';
        const existingControls = document.querySelector('.table-controls');
        if (existingControls) { existingControls.remove(); }
        renderGrid();
    };
    
    // !! ---- 添加旋转按钮的事件监听器 ----
    const rotateLeftBtn = document.getElementById('rotateLeftBtn');
    const rotateRightBtn = document.getElementById('rotateRightBtn');

    if(rotateLeftBtn) rotateLeftBtn.onclick = function() {
        if (editMode && editModeType === 'rotate' && selectedSeatIndex !== null) {
            const person = seatData.find(s => s.index === selectedSeatIndex);
            if (person) {
                person.rotate = (person.rotate || 0) + 90; // 顺时针旋转90度
                if (person.rotate >= 360) person.rotate = 0;
                saveData();
                renderGrid();
            }
        }
    };

    if(rotateRightBtn) rotateRightBtn.onclick = function() {
        if (editMode && editModeType === 'rotate' && selectedSeatIndex !== null) {
            const person = seatData.find(s => s.index === selectedSeatIndex);
            if (person) {
                person.flip = !person.flip; // 切换水平翻转状态
                saveData();
                renderGrid();
            }
        }
    };
    // !! ---- 旋转按钮事件监听器结束 ----

    document.getElementById('seatingGrid').onclick = function(e) {
        const grid = document.getElementById('seatingGrid'); 
        // 非编辑模式逻辑
        if (!editMode) {
            let seatElement = e.target.closest('.seat');
            if(seatElement && seatElement.dataset.col === '9') return; // 忽略屏幕区点击

            if (seatElement) {
                const idx = parseInt(seatElement.dataset.index);
                const person = seatData.find(s => s.index === idx);

                if (person) {
                    // 点击了带人名的座位 -> 切换标记状态
                    person.marked = !person.marked; 
                    saveData();
                    
                    // !! ---- 手动移除覆盖层 (如果取消标记) ----
                    if (!person.marked) {
                         const overlay = seatElement.querySelector('.mark-overlay');
                         if (overlay) {
                             console.log(`[onClick] Manually removing overlay for seat ${idx}`);
                             overlay.remove();
                         }
                         // 同时确保移除 marked 类 (renderGrid 也会做，但这里做更直接)
                         seatElement.classList.remove('marked'); 
                    }
                    // !! ---- 手动移除结束 ----
                    
                    // 重新渲染以更新背景色等 (覆盖层应已处理)
                    renderGrid(); 
                } 
            }
             // 确保不添加 selected 类
             if(seatElement) seatElement.classList.remove('selected');

        } else {
             // 编辑模式逻辑
             // ... [不变]
        }
    };
    
    // !! ---- 添加编辑标题弹窗相关事件 ----
    const editTitleBtn = document.getElementById('editTitleBtn');
    const editTitleModal = document.getElementById('editTitleModal');
    const closeEditTitle = document.getElementById('closeEditTitle');
    const saveTitleBtn = document.getElementById('saveTitleBtn');
    const mainTitleInput = document.getElementById('mainTitleInput');
    const mainTitleColorInput = document.getElementById('mainTitleColorInput');
    const mainTitleFontSizeInput = document.getElementById('mainTitleFontSizeInput');
    const mainTitleOpacityInput = document.getElementById('mainTitleOpacityInput');
    const mainTitleOpacityValue = document.getElementById('mainTitleOpacityValue');

    // !! 获取副标题弹窗元素 !!
    const showSubTitleInput = document.getElementById('showSubTitleInput');
    const subTitleInput = document.getElementById('subTitleInput');
    const subTitleColorInput = document.getElementById('subTitleColorInput');
    const subTitleFontSizeInput = document.getElementById('subTitleFontSizeInput');
    const subTitleOpacityInput = document.getElementById('subTitleOpacityInput');
    const subTitleOpacityValue = document.getElementById('subTitleOpacityValue');

    if(editTitleBtn) editTitleBtn.onclick = function() {
        mainTitleInput.value = mainTitle;
        mainTitleColorInput.value = mainTitleColor;
        mainTitleFontSizeInput.value = parseInt(mainTitleFontSize); // 从 '32px' 中取数字
        mainTitleOpacityInput.value = mainTitleOpacity;
        mainTitleOpacityValue.textContent = Math.round(mainTitleOpacity * 100) + '%';

        // !! 加载副标题值到弹窗 !!
        if (showSubTitleInput) showSubTitleInput.checked = showSubTitle;
        if (subTitleInput) subTitleInput.value = subTitle;
        if (subTitleColorInput) subTitleColorInput.value = subTitleColor;
        if (subTitleFontSizeInput) subTitleFontSizeInput.value = parseInt(subTitleFontSize);
        if (subTitleOpacityInput) subTitleOpacityInput.value = subTitleOpacity;
        if (subTitleOpacityValue) subTitleOpacityValue.textContent = Math.round(subTitleOpacity * 100) + '%';
        
        editTitleModal.style.display = 'flex';
    };

    if (mainTitleOpacityInput && mainTitleOpacityValue) {
        mainTitleOpacityInput.oninput = function() {
            mainTitleOpacityValue.textContent = Math.round(this.value * 100) + '%';
        };
    }
    // !! 副标题透明度滑块事件 !!
    if (subTitleOpacityInput && subTitleOpacityValue) {
        subTitleOpacityInput.oninput = function() {
            subTitleOpacityValue.textContent = Math.round(this.value * 100) + '%';
        };
    }

    if(closeEditTitle) closeEditTitle.onclick = function() {
        editTitleModal.style.display = 'none';
    };

    if(saveTitleBtn) saveTitleBtn.onclick = function() {
        mainTitle = mainTitleInput.value.trim() || mainTitle;
        mainTitleColor = mainTitleColorInput.value;
        mainTitleFontSize = mainTitleFontSizeInput.value + 'px'; // 保存时加上 'px'
        mainTitleOpacity = parseFloat(mainTitleOpacityInput.value);
        
        // !! 保存副标题值 !!
        if (showSubTitleInput) showSubTitle = showSubTitleInput.checked;
        if (subTitleInput) subTitle = subTitleInput.value.trim();
        if (subTitleColorInput) subTitleColor = subTitleColorInput.value;
        if (subTitleFontSizeInput) subTitleFontSize = subTitleFontSizeInput.value + 'px';
        if (subTitleOpacityInput) subTitleOpacity = parseFloat(subTitleOpacityInput.value);
        
        editTitleModal.style.display = 'none';
        saveData();
        renderTitles();
    };
    // !! ---- 编辑标题弹窗事件结束 ----

    // !! 绑定标记配置按钮
    const markConfigBtn = document.getElementById('markConfigBtn');
    if(markConfigBtn) markConfigBtn.onclick = showMarkControls;

    // !! 绑定名字配置按钮 !!
    const nameConfigBtn = document.getElementById('nameConfigBtn');
    if(nameConfigBtn) nameConfigBtn.onclick = showNameControls;
}

// 拖动模式下：直接拖拽换位置
function enableDrag() {
    const grid = document.getElementById('seatingGrid');
    let dragIdx = null;
    
    grid.querySelectorAll('.seat:not([data-col="9"])').forEach(seat => {
        // !! 恢复检查
        if (seat.classList.contains('table-filled')) { 
            seat.draggable = false;
            return;
        }
        
        seat.draggable = true;
        seat.ondragstart = function(e) {
            dragIdx = parseInt(seat.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
        };
        seat.ondragover = function(e) {
            e.preventDefault();
             // !! 恢复检查
            if (seat.classList.contains('table-filled')) return;
            seat.classList.add('drag-over');
        };
        seat.ondragleave = function() {
            seat.classList.remove('drag-over');
        };
        seat.ondrop = function(e) {
            e.preventDefault();
            seat.classList.remove('drag-over');
            // !! 恢复检查
            if (seat.classList.contains('table-filled')) return;
            
            const dropIdx = parseInt(seat.dataset.index);
            if (dragIdx !== null && dragIdx !== dropIdx) {
                const dragPerson = seatData.find(s => s.index === dragIdx);
                const dropPerson = seatData.find(s => s.index === dropIdx);
                if (dragPerson) {
                    dragPerson.index = dropIdx;
                    if (dropPerson) dropPerson.index = dragIdx;
                    saveData();
                    renderGrid();
                }
            }
            dragIdx = null;
        };
        
        seat.onmousedown = null;
        seat.onmouseup = null;
        seat.onmouseleave = null;
    });
}
// 旋转模式下：点击选中，旋转按钮生效
function enableRotateSelect() {
    const grid = document.getElementById('seatingGrid');
    grid.querySelectorAll('.seat:not([data-col="9"])').forEach(seat => {
        seat.draggable = false;
        seat.onmousedown = null;
        seat.onmouseup = function(e) {
            if (!editMode || seat.dataset.col === '9') return; // 忽略第10列
            if (e.button === 0) {
                selectedSeatIndex = parseInt(seat.dataset.index);
                renderGrid();
            }
        };
        seat.onmouseleave = null;
    });
}
// 打开管理人名弹窗
function openManageModal() {
    if (!editMode) return; // 确保只有在编辑模式下才能打开
    document.getElementById('manageModal').style.display = 'flex';
    renderNameList();
}
function closeManageModal() {
    document.getElementById('manageModal').style.display = 'none';
}
// 添加人名
function addName() {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();
    
    if (!name) {
        alert('请输入人名');
        return;
    }
    
    if (nameList.includes(name)) {
        alert('该人名已存在');
        return;
    }
    
    nameList.push(name);
    input.value = '';
    renderNameList();
    
    // 调试信息
    console.log('添加人名成功:', name);
    console.log('当前人名列表:', nameList);
}
// 删除人名
function deleteName(index) {
    // 删除人名
    const delName = nameList[index];
    nameList.splice(index, 1);
    // 同步删除seatData中该人名
    seatData = seatData.filter(s => s.name !== delName);
    renderNameList();
    saveData();
}
// 渲染人名列表
function renderNameList() {
    const ul = document.getElementById('nameList');
    ul.innerHTML = '';
    nameList.forEach((n, i) => {
        const li = document.createElement('li');
        li.textContent = n;
        // 添加删除按钮
        const delBtn = document.createElement('button');
        delBtn.textContent = '删除';
        delBtn.style.marginLeft = '12px';
        delBtn.style.background = '#e53935';
        delBtn.style.fontSize = '0.9em';
        delBtn.onclick = function() { deleteName(i); };
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
}
// 保存人名到座位
function saveNames() {
    if (nameList.length === 0) {
        alert('请先添加人名');
        return;
    }
    
    // 只在空座位分配新名字
    let usedIndexes = seatData.map(s => s.index);
    let emptyIndexes = [];
    for (let i = 0; i < GRID_TOTAL; i++) {
        if (!usedIndexes.includes(i)) emptyIndexes.push(i);
    }
    
    // 只保留已分配的名字
    seatData = seatData.filter(s => nameList.includes(s.name));
    
    // 新增未分配的名字
    nameList.forEach(name => {
        if (!seatData.find(s => s.name === name)) {
            if (emptyIndexes.length > 0) {
                seatData.push({index: emptyIndexes.shift(), name, marked: false});
            }
        }
    });
    
    console.log('保存座位数据:', seatData);
    saveData();
    renderGrid();
    closeManageModal();
}
// 编辑模式切换
function toggleEditMode() {
    editMode = !editMode;
    
    // 更新按钮外观
    updateEditButtonAppearance(); // 调用新函数

    // 更新其他 UI 元素 (管理按钮、导出/导入按钮等)
    const manageBtn = document.getElementById('manageBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const editTitleBtnOnTitle = document.querySelector('.title-block #editTitleBtn'); // 获取标题旁的编辑按钮
    const changeTitleBgBtn = document.getElementById('changeTitleBgBtn');
    const deleteTitleBgBtn = document.getElementById('deleteTitleBgBtn');
    const drawTableBtn = document.getElementById('drawTableBtn');
    const iconTools = document.getElementById('iconTools'); // 获取iconTools容器
    const controlButtonsGroup = document.querySelector('.control-buttons-group'); // 获取调整/旋转按钮组


    if (manageBtn) manageBtn.style.display = editMode ? 'inline-block' : 'none';
    if (exportBtn) exportBtn.style.display = editMode ? 'inline-block' : 'none';
    if (importBtn) importBtn.style.display = editMode ? 'inline-block' : 'none';
    if (editTitleBtnOnTitle) editTitleBtnOnTitle.style.display = editMode ? 'inline-block' : 'none'; 
    if (changeTitleBgBtn) changeTitleBgBtn.style.display = editMode ? 'inline-block' : 'none';
    if (deleteTitleBgBtn) deleteTitleBgBtn.style.display = editMode ? 'inline-block' : 'none';
    if (drawTableBtn) drawTableBtn.style.display = editMode ? 'inline-block' : 'none';
    if (iconTools) iconTools.style.display = editMode ? 'inline-flex' : 'none'; // 控制iconTools的显隐
    if (controlButtonsGroup) controlButtonsGroup.style.display = editMode ? 'flex' : 'none'; // 控制调整/旋转按钮组的显隐

    if (!editMode) {
        // 退出编辑模式时需要做的其他事情
        saveData(); 
        console.log(`[toggleEditMode Exit] State before final render: markOverlayColor=${markOverlayColor}, markOverlayOpacity=${markOverlayOpacity}`);
        // !! 统一移除所有控制面板 !!
        document.querySelectorAll('.screen-controls, .table-controls, .mark-controls, .name-controls').forEach(el => el.remove());
        tableDrawMode = false; 
    } else {
        // 进入编辑模式时需要做的其他事情 (如果需要)
        const existingTableControls = document.querySelector('.table-controls');
        if (existingTableControls) { existingTableControls.remove(); }
        // !! 关闭绘桌模式时，也移除其他可能的面板，以保持一致性 !!
        document.querySelectorAll('.screen-controls, .mark-controls, .name-controls').forEach(el => el.remove());
    }

    // 重新渲染 (renderGrid 内部也会处理一些编辑模式相关的 UI)
    renderGrid();
    renderTitles();
}

// 切换绘桌模式
function toggleTableDrawMode() {
    const drawTableBtn = document.getElementById('drawTableBtn');
    const dragModeBtn = document.getElementById('dragModeBtn');
    const rotateModeBtn = document.getElementById('rotateModeBtn');
    const chairIconBtn = document.getElementById('chairIconBtn');
    const rotateTools = document.getElementById('rotateTools');

    if (tableDrawMode) {
        // 关闭绘桌模式
        tableDrawMode = false;
        editModeType = 'drag'; // 默认回到拖拽模式
        if (drawTableBtn) drawTableBtn.classList.remove('active');
        if (dragModeBtn) dragModeBtn.classList.add('active'); // 激活拖拽按钮
        if (rotateModeBtn) rotateModeBtn.classList.remove('active');
        if (chairIconBtn) chairIconBtn.style.display = 'inline'; // 显示椅子图标
        if (rotateTools) rotateTools.style.display = 'none';

        const existingTableControls = document.querySelector('.table-controls');
        if (existingTableControls) { existingTableControls.remove(); }
        // !! 关闭绘桌模式时，不需要移除屏幕面板，让用户可以继续操作或点击屏幕区域重新打开

    } else {
        // 进入绘桌模式
        tableDrawMode = true;
        editModeType = 'none'; // 设置特殊模式类型
        if (drawTableBtn) drawTableBtn.classList.add('active');
        if (dragModeBtn) dragModeBtn.classList.remove('active');
        if (rotateModeBtn) rotateModeBtn.classList.remove('active');
        if (chairIconBtn) chairIconBtn.style.display = 'none'; // 隐藏椅子图标
        if (rotateTools) rotateTools.style.display = 'none'; // 隐藏旋转工具
        
        // !! 进入绘桌模式时，移除其他所有控制面板 !!
        document.querySelectorAll('.screen-controls, .mark-controls, .name-controls').forEach(el => el.remove());
        
        showTableControls();
    }
    renderGrid(); // 重新渲染以应用模式更改
}

// 显示桌子控制面板
function showTableControls() {
    closeOtherPanels('table-controls');
    const existingControls = document.querySelector('.table-controls');
    if (existingControls) return; // 如果已存在，则不重新创建
    
    const controls = document.createElement('div');
    controls.className = 'table-controls';
    controls.innerHTML = ` 
        <h4>桌子设置</h4>
        <div class="control-group">
            <label for="tableColorInput">颜色</label>
            <input type="color" id="tableColorInput" value="${tableColor}">
        </div>
         <div class="control-group">
             <label for="tableOpacityInput">透明度</label>
            <input type="range" id="tableOpacityInput" min="0.1" max="1" step="0.1" value="${tableOpacity}">
            <span id="opacityValue">${Math.round(tableOpacity * 100)}%</span>
        </div>
        <div class="control-group">
            <label for="tablePatternSelect">纹理</label>
           <select id="tablePatternSelect">
               <option value="solid" ${tablePattern === 'solid' ? 'selected' : ''}>纯色</option>
               <option value="grid" ${tablePattern === 'grid' ? 'selected' : ''}>网格</option>
               <option value="stripe" ${tablePattern === 'stripe' ? 'selected' : ''}>条纹</option>
               <option value="dots" ${tablePattern === 'dots' ? 'selected' : ''}>点状</option>
           </select>
       </div>
    `; // 模板字符串结束符
    // 插入到 header 之后，main 之前，或 body 末尾
    document.body.appendChild(controls); // 暂放 body 末尾
    
    const colorInput = document.getElementById('tableColorInput');
    const opacityInput = document.getElementById('tableOpacityInput');
    const patternSelect = document.getElementById('tablePatternSelect');
    const opacityValueSpan = document.getElementById('opacityValue');

    colorInput.addEventListener('change', function(e) {
        tableColor = e.target.value;
        saveData(); 
        // 不需要更新整个 grid，填充时会用新颜色
    });
    
    opacityInput.addEventListener('input', function(e) {
        opacityValueSpan.textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
    });
    opacityInput.addEventListener('change', function(e) {
        tableOpacity = parseFloat(e.target.value);
        opacityValueSpan.textContent = Math.round(tableOpacity * 100) + '%';
        saveData();
        // 需要更新现有桌子
        renderGrid(); 
    });
    
    patternSelect.addEventListener('change', function(e) {
        tablePattern = e.target.value;
        saveData();
        // 需要更新现有桌子
        renderGrid(); 
    });

    const closeAndCleanup = () => {
        controls.remove();
        if (activeControlPanelCloseHandler) {
            document.removeEventListener('click', activeControlPanelCloseHandler);
            activeControlPanelCloseHandler = null;
        }
        // 当绘图控件关闭时，确保绘图模式也关闭，并更新按钮状态
        if (tableDrawMode) {
            const drawTableBtn = document.getElementById('drawTableBtn');
            if(drawTableBtn) drawTableBtn.classList.remove('active');
            tableDrawMode = false;
            // 还原到拖拽模式作为默认
            editModeType = 'drag';
            const dragModeBtn = document.getElementById('dragModeBtn');
            if(dragModeBtn) dragModeBtn.classList.add('active');
            const chairIconBtn = document.getElementById('chairIconBtn');
            if (chairIconBtn) chairIconBtn.style.display = 'inline';
            renderGrid(); // 确保UI更新
        }
    };
    const closeTableBtn = controls.querySelector('#closeTableControls');
    if (closeTableBtn) {
        closeTableBtn.onclick = closeAndCleanup;
    }
    
    activeControlPanelCloseHandler = (event) => {
        if (!controls.contains(event.target) && event.target !== document.getElementById('drawTableBtn')) {
           closeAndCleanup();
        }
    };
    setTimeout(() => {
        document.addEventListener('click', activeControlPanelCloseHandler);
    }, 0);
}

// 清除或填充单元格
function toggleCellFill(row, col) {
    const idx = row * GRID_COLS + col;
    const hasPerson = seatData.some(s => s.index === idx);
    if (hasPerson) return; 
    
    const cellIdx = filledCells.findIndex(cell => cell.row === row && cell.col === col);
    
    if (cellIdx >= 0) {
        filledCells.splice(cellIdx, 1);
    } else {
        filledCells.push({
            row, col, 
            color: tableColor, 
            opacity: tableOpacity,
            pattern: tablePattern
        });
    }
    saveData();
    renderGrid();
}

// 根据表格纹理类型应用样式
function applyTablePattern(color, pattern, opacity) {
    const hexToRgba = (hex, alpha) => {
        if (!hex || !hex.startsWith('#') || hex.length < 7) hex = '#e1f5fe';
        alpha = parseFloat(alpha);
        if (isNaN(alpha) || alpha < 0) alpha = 1; 
        if (alpha > 1) alpha = 1;
        
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    const rgbaColor = hexToRgba(color, opacity);
    // 为纹理生成稍微不同的颜色以增加对比度
    const lighterRgbaColor = hexToRgba(lightenColor(color, opacity < 0.5 ? 35 : 20), opacity * 1.1 > 1 ? 1 : opacity * 1.1); 

    switch (pattern) {
        case 'grid':
            return `repeating-linear-gradient(0deg, ${rgbaColor}, ${rgbaColor} 8px, ${lighterRgbaColor} 8px, ${lighterRgbaColor} 10px),
                   repeating-linear-gradient(90deg, ${rgbaColor}, ${rgbaColor} 8px, ${lighterRgbaColor} 8px, ${lighterRgbaColor} 10px)`;
        case 'stripe':
            return `repeating-linear-gradient(45deg, ${rgbaColor}, ${rgbaColor} 8px, ${lighterRgbaColor} 8px, ${lighterRgbaColor} 16px)`;
        case 'dots':
            // 使用 background-image 和 background-color 结合
             return `radial-gradient(${lighterRgbaColor} 2px, transparent 2px), ${rgbaColor}`; // 底色是 rgbaColor
             // 需要配合 background-size 等 CSS 属性
             // 简单起见，暂时返回一个近似效果
             // return \`radial-gradient(\${lighterRgbaColor} 15%, transparent 16%), \${rgbaColor}\`; // Doesn't work well with background-size auto
        case 'solid':
        default:
            return rgbaColor;
    }
}

// 辅助函数：使颜色变浅/深
function lightenColor(color, percent) {
    // 确保 color 是有效的 hex 颜色
    if (!color || !color.startsWith('#') || color.length < 7) {
        console.warn('Invalid color passed to lightenColor:', color);
        color = '#ffffff'; // 提供一个默认值
    }
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // 处理 NaN 的情况
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
         console.warn('Could not parse color:', color);
         r = 255; g = 255; b = 255; // 使用白色作为回退
    }
    
    // 调整亮度
    const factor = 1 + percent / 100;
    r = Math.max(0, Math.min(255, Math.round(r * factor)));
    g = Math.max(0, Math.min(255, Math.round(g * factor)));
    b = Math.max(0, Math.min(255, Math.round(b * factor)));
    
    // !! 修正：确保返回正确的模板字符串
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 更新屏幕区域背景 (辅助函数)
function updateScreenBackground() {
    const grid = document.getElementById('seatingGrid');
    if (!grid) return;
    const rgbaColor = colorToRgba(screenBg, screenOpacity);

    // 获取在 renderGrid 中定义的屏幕实际行范围
    const screenStartRow = 2; 
    const screenEndRow = GRID_ROWS - 3; // (17-3 = 14)

    // 选择第10列 (data-col="9"), 并使用正确的行范围
    for (let row = screenStartRow; row <= screenEndRow; row++) {
        const seat = grid.querySelector(`.seat[data-col="9"][data-row="${row}"]`);
        if (seat) {
            seat.style.backgroundColor = rgbaColor;
        }
    }
     // 更新CSS变量 (如果使用)
    grid.style.setProperty('--screen-bg', screenBg); // 这个可能不再直接有效如果每个格子分别设置颜色
}

// 显示屏幕控制面板
function showScreenControls() {
    closeOtherPanels('screen-controls');
    const oldControls = document.querySelector('.screen-controls');
    if (oldControls) oldControls.remove();

    const controls = document.createElement('div');
    controls.className = 'screen-controls';
    controls.innerHTML = `
        <h4>屏幕设置</h4>
        <div class="control-group">
            <label for="screenColorPicker">颜色</label>
            <input type="color" id="screenColorPicker" value="${screenBg}">
        </div>
        <div class="control-group">
            <label for="screenOpacitySlider">透明度</label>
            <input type="range" id="screenOpacitySlider" min="0" max="1" step="0.05" value="${screenOpacity}">
            <span id="screenOpacityValue">${Math.round(screenOpacity * 100)}%</span>
        </div>
        <button id="closeScreenControls">关闭</button>
    `;
    document.body.appendChild(controls);

    const colorPicker = document.getElementById('screenColorPicker');
    const opacitySlider = document.getElementById('screenOpacitySlider');
    const opacityValueSpan = document.getElementById('screenOpacityValue');
    const closeBtn = document.getElementById('closeScreenControls');

    colorPicker.addEventListener('change', (e) => {
        screenBg = e.target.value;
        saveData();
        updateScreenBackground(); 
    });

    opacitySlider.addEventListener('input', (e) => {
        const newOpacity = parseFloat(e.target.value);
        opacityValueSpan.textContent = Math.round(newOpacity * 100) + '%';
        // 实时预览
        screenOpacity = newOpacity;
        updateScreenBackground();
    });
     opacitySlider.addEventListener('change', (e) => {
        // input事件已更新 screenOpacity, 这里只需保存
        saveData();
    });

    const closeAndCleanup = () => {
        controls.remove();
        if (activeControlPanelCloseHandler) {
            document.removeEventListener('click', activeControlPanelCloseHandler);
            activeControlPanelCloseHandler = null;
        }
    };
    closeBtn.onclick = closeAndCleanup;

    activeControlPanelCloseHandler = (event) => {
        // 确保点击的不是屏幕本身触发区域 (col 7, rows 2-12)
        const targetSeat = event.target.closest('.seat');
        const isScreenTrigger = targetSeat && targetSeat.dataset.col === '7' && 
                                parseInt(targetSeat.dataset.row) >= 2 && 
                                parseInt(targetSeat.dataset.row) <= 12;

        if (!controls.contains(event.target) && !isScreenTrigger) {
            closeAndCleanup();
        }
    };
    setTimeout(() => {
        document.addEventListener('click', activeControlPanelCloseHandler);
    }, 0);
}

// 更新标记覆盖层 (辅助函数)
function updateMarkOverlays() {
    const grid = document.getElementById('seatingGrid');
    if (!grid) return;
    const rgbaColor = colorToRgba(markOverlayColor, markOverlayOpacity);
    // 选择所有已标记的座位 (前7列)
    grid.querySelectorAll('.seat.marked:not([data-col="7"])').forEach(seat => {
        let overlay = seat.querySelector('.mark-overlay');
        if (!overlay) { // 如果覆盖层不存在，创建它
            overlay = document.createElement('div');
            overlay.className = 'mark-overlay';
            seat.appendChild(overlay);
        }
        overlay.style.backgroundColor = rgbaColor;
    });
}

// 显示标记控制面板
function showMarkControls() {
    closeOtherPanels('mark-controls');
    const oldControls = document.querySelector('.mark-controls');
    if (oldControls) oldControls.remove();

    const controls = document.createElement('div');
    controls.className = 'mark-controls';
    controls.innerHTML = `
        <h4>标记样式</h4>
        <div class="control-group">
            <label for="markColorPicker">覆盖颜色</label>
            <input type="color" id="markColorPicker" value="${markOverlayColor}">
        </div>
        <div class="control-group">
            <label for="markOpacitySlider">覆盖透明度</label>
            <input type="range" id="markOpacitySlider" min="0" max="1" step="0.05" value="${markOverlayOpacity}">
            <span id="markOpacityValue">${Math.round(markOverlayOpacity * 100)}%</span>
        </div>
        <button id="closeMarkControls">关闭</button>
    `;
    document.body.appendChild(controls);

    const colorPicker = document.getElementById('markColorPicker');
    const opacitySlider = document.getElementById('markOpacitySlider');
    const opacityValueSpan = document.getElementById('markOpacityValue');
    const closeBtn = document.getElementById('closeMarkControls');

    colorPicker.addEventListener('change', (e) => {
        markOverlayColor = e.target.value;
        // !! 添加日志: 打印将要保存的值
        console.log(`[MarkControls] 颜色更改，准备保存: color=${markOverlayColor}`);
        saveData();
        updateMarkOverlays(); 
    });

    opacitySlider.addEventListener('input', (e) => {
        const newOpacity = parseFloat(e.target.value);
        opacityValueSpan.textContent = Math.round(newOpacity * 100) + '%';
        markOverlayOpacity = newOpacity;
        updateMarkOverlays(); // 实时更新
    });
     opacitySlider.addEventListener('change', (e) => {
         // !! 添加日志: 打印将要保存的值
         console.log(`[MarkControls] 透明度更改确认，准备保存: opacity=${markOverlayOpacity}`);
        saveData(); // 只在最终确认时保存
    });

    const closeAndCleanup = () => {
        controls.remove();
        if (activeControlPanelCloseHandler) {
            document.removeEventListener('click', activeControlPanelCloseHandler);
            activeControlPanelCloseHandler = null;
        }
    };
    closeBtn.onclick = closeAndCleanup;

    activeControlPanelCloseHandler = (event) => {
        if (!controls.contains(event.target) && event.target !== document.getElementById('markConfigBtn')) {
            closeAndCleanup();
        }
    };
    setTimeout(() => {
        document.addEventListener('click', activeControlPanelCloseHandler);
    }, 0);
}

// 更新编辑按钮的外观（大小、位置、文本）
function updateEditButtonAppearance() {
    const editBtn = document.getElementById('editBtn');
    if (!editBtn) return; // 如果按钮不存在则退出

    const mainContainer = document.querySelector('main'); 

    editBtn.textContent = editMode ? '保存' : '✏️';

    if (!editMode) {
        // 非编辑模式: 缩小并定位按钮
        if (mainContainer) {
            mainContainer.style.position = 'relative'; // 确保父容器是相对定位
        }
        editBtn.style.position = 'absolute'; 
        editBtn.style.top = '1px';
        editBtn.style.left = '1px';
        editBtn.style.transform = 'scale(0.5)';
        editBtn.style.transformOrigin = 'top left';
        editBtn.style.zIndex = '1001'; 
        editBtn.style.display = 'inline-block'; // 确保可见
        editBtn.style.visibility = 'visible'; 
        console.log('[updateEditButtonAppearance] Applied non-edit mode styles.');

    } else {
        // 编辑模式: 恢复默认样式
        if (mainContainer) {
            mainContainer.style.position = ''; // 移除父容器的相对定位 (如果之前设置了)
        }
        editBtn.style.position = ''; 
        editBtn.style.top = '';      
        editBtn.style.left = '';     
        editBtn.style.transform = ''; 
        editBtn.style.transformOrigin = ''; 
        editBtn.style.zIndex = '';    
        editBtn.style.display = '';   
        editBtn.style.visibility = ''; 
        console.log('[updateEditButtonAppearance] Applied edit mode styles.');
    }
}

// !! 新增：显示名字样式控制面板 !!
let currentEditingNameStyleFor = 'unmarked'; // 'unmarked' 或 'marked'

// 全局变量，用于跟踪当前打开的控制面板的关闭函数
let activeControlPanelCloseHandler = null;

// 统一的关闭其他面板的函数
function closeOtherPanels(exceptPanelClass) {
    document.querySelectorAll('.screen-controls, .table-controls, .mark-controls, .name-controls').forEach(el => {
        if (!el.classList.contains(exceptPanelClass)) {
            el.remove();
        }
    });
    // 如果存在旧的全局点击监听器，移除它
    if (activeControlPanelCloseHandler) {
        document.removeEventListener('click', activeControlPanelCloseHandler);
        activeControlPanelCloseHandler = null;
    }
}

function showNameControls() {
    closeOtherPanels('name-controls'); // 关闭其他所有面板

    const oldControls = document.querySelector('.name-controls');
    if (oldControls) oldControls.remove(); // 确保移除旧的实例

    const controls = document.createElement('div');
    controls.className = 'name-controls'; // 依赖 style.css 中的 .name-controls 类来定位和美化

    let currentColor = currentEditingNameStyleFor === 'unmarked' ? nameTextColorUnmarked : nameTextColorMarked;
    let currentOpacity = currentEditingNameStyleFor === 'unmarked' ? nameTextOpacityUnmarked : nameTextOpacityMarked;

    controls.innerHTML = `
        <h4>名字颜色设置</h4>
        <div class="control-group button-row" style="margin-bottom: 10px;">
            <button id="nameStyleUnmarkedBtn" class="${currentEditingNameStyleFor === 'unmarked' ? 'active' : ''}">未标记时</button>
            <button id="nameStyleMarkedBtn" class="${currentEditingNameStyleFor === 'marked' ? 'active' : ''}">标记时</button>
        </div>
        <div class="control-group">
            <label for="nameColorPicker">颜色</label>
            <input type="color" id="nameColorPicker" value="${currentColor}">
        </div>
        <div class="control-group">
            <label for="nameOpacitySlider">透明度</label>
            <input type="range" id="nameOpacitySlider" min="0" max="1" step="0.05" value="${currentOpacity}">
            <span id="nameOpacityValue">${Math.round(currentOpacity * 100)}%</span>
        </div>
        <button id="closeNameControls" style="margin-top: 10px;">关闭</button>
    `;
    document.body.appendChild(controls);

    const unmarkedBtn = document.getElementById('nameStyleUnmarkedBtn');
    const markedBtn = document.getElementById('nameStyleMarkedBtn');
    const nameColorPicker = document.getElementById('nameColorPicker');
    const nameOpacitySlider = document.getElementById('nameOpacitySlider');
    const nameOpacityValueSpan = document.getElementById('nameOpacityValue');
    const closeBtn = document.getElementById('closeNameControls');

    unmarkedBtn.onclick = () => {
        currentEditingNameStyleFor = 'unmarked';
        showNameControls(); 
    };
    markedBtn.onclick = () => {
        currentEditingNameStyleFor = 'marked';
        showNameControls(); 
    };

    nameColorPicker.addEventListener('change', (e) => {
        if (currentEditingNameStyleFor === 'unmarked') {
            nameTextColorUnmarked = e.target.value;
        } else {
            nameTextColorMarked = e.target.value;
        }
        saveData();
        renderGrid(); 
    });

    nameOpacitySlider.addEventListener('input', (e) => {
        const newOpacity = parseFloat(e.target.value);
        nameOpacityValueSpan.textContent = Math.round(newOpacity * 100) + '%';
        if (currentEditingNameStyleFor === 'unmarked') {
            nameTextOpacityUnmarked = newOpacity;
        } else {
            nameTextOpacityMarked = newOpacity;
        }
        renderGrid(); 
    });
    nameOpacitySlider.addEventListener('change', () => {
        saveData(); 
    });

    const closeAndCleanup = () => {
        controls.remove();
        if (activeControlPanelCloseHandler) {
            document.removeEventListener('click', activeControlPanelCloseHandler);
            activeControlPanelCloseHandler = null;
        }
    };

    closeBtn.onclick = closeAndCleanup;

    // 点击外部关闭逻辑
    activeControlPanelCloseHandler = (event) => {
        if (!controls.contains(event.target) && event.target !== document.getElementById('nameConfigBtn')) {
            // 检查点击的是否是打开面板的按钮本身
            let triggerButton = document.getElementById('nameConfigBtn');
            if (event.target !== triggerButton && !triggerButton.contains(event.target)) {
                 closeAndCleanup();
            }
        }
    };
    // 使用 setTimeout 确保事件监听器在当前点击事件处理完毕后添加
    setTimeout(() => {
        document.addEventListener('click', activeControlPanelCloseHandler);
    }, 0);
}
