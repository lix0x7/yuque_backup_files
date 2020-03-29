const https = require('https');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const errors = require('./errors');

class Storage {
    constructor(basePath = '.') {
        this._basePath = basePath;

        // 用于存储操作过的文件，最后对遗留的历史文件进行移除
        this._rememberedFiles = []
    }

    /**
     * 初始化存储空间
     */
    initBaseFolder() {
        // clear old data
        if (fs.existsSync(this._basePath)) {
            fs.rmdirSync(this._basePath, {recursive: true});
        }
    }

    /**
     * 移除不在 this._remeberedFiles 中的文件
     */
    filterFiles(){
        // todo
    }

    /**
     *
     * @param {Array} filepathList - path list to be joined with the base path as one path, the last one should be the file name.
     * @param {String} content
     * @param {Boolean} isMd - add .md suffix on file name
     */
    saveFile(filepathList, content, isMd = false) {
        if (!(filepathList instanceof Array)) {
            filepathList = [filepathList]
        }

        let fileName = _.last(filepathList);
        fileName = fileName.replace(/\//g, '\\');
        if (isMd && !fileName.endsWith('md')) {
            fileName += '.md';
        }

        let filepath = path.join(...[this._basePath, ...filepathList.slice(0, filepathList.length - 1), fileName].filter(item => item));

        const pathname = path.dirname(filepath);
        if (!fs.existsSync(pathname)) {
            fs.mkdirSync(pathname, {recursive: true})
        }

        fs.writeFileSync(filepath, content, {});
    }

    /**
     *
     * @param {String} url
     * @param {String|Array} picPath
     */
    async savePicByUrl(url, picPath) {
        if (!(picPath instanceof Array)) {
            picPath = [picPath];
        }

        // 拼接 base dir、自定义 pic 目录、从链接中抽取的文件名
        const anchorIndex = url.lastIndexOf('#') === -1 ? url.lastIndexOf('#') : Number.MAX_SAFE_INTEGER;
        picPath = path.join(this._basePath, ...picPath, url.slice(url.lastIndexOf('/'), url.lastIndexOf('#')));

        fs.mkdirSync(path.dirname(picPath), {recursive: true});

        await this._downloadFile(url, picPath);
    }

    _downloadFile(url, filepath) {
        if (fs.existsSync(filepath)){
            return true;
        }

        const fileStream = fs.createWriteStream(filepath);

        return new Promise((resolve, reject) => {
            https.get(url, rsp => {
                resolve(rsp.pipe(fileStream));
            }).on('error', () => {
                reject(new DownloadError(`Download failed: ${url}.`));
            })
        });
    }
}

module.exports = Storage;