const YuqueSdk = require('@yuque/sdk');
const Storage = require('./storage');
const path = require('path');
const lodash = require('lodash');

class Backuper{
    constructor(token, userName,
                need_interval = false, interval=60*60*1000,
                storage= new Storage('./backup-data/')
    ) {
        this._token = token;
        this._userName = userName;
        this._need_interval = need_interval;
        this._interval = interval;

        this.yuque = new YuqueSdk({
            token: this._token,
        });

        this._storager = storage;
        this._storager.initBaseFolder();

    }

    backup(){
        if (this._need_interval){
            setInterval(this._backupOnce, this._interval);
        }else {
            this._backupOnce();
        }
    }

    /**
     * iterate and save repos / docs.
     * @returns {Promise<void>}
     * @private
     */
    async _backupOnce() {
        const user = await this.yuque.users.get();
        const repos = await this.yuque.repos.list({user: user.id});
        // console.log(repos);
        for (const repo of repos) {

            this._storager.saveFile([repo.name, 'manifest.json'], JSON.stringify(repo, null, 2));

            const docs = await this.yuque.docs.list({namespace: repo.id});
            for (const doc of docs) {
                console.log('Backuping doc: ', doc.title);
                const docDetail = await this.yuque.docs.get({namespace: repo.namespace, slug: doc.slug, data: {raw: true}});
                this._storager.saveFile([repo.name, doc.title], docDetail.body_draft, true);
                // await this._downloadAllImg(docDetail.body_draft, [repo.name, 'pic'])
            }
        }
    }

    /**
     * 从文章中提取图像的 url，包括普通 md 形式和 html 形式
     * @param {String} content
     * @param {String|Array} picPathList
     * @private
     */
    async _downloadAllImg(content, picPathList) {
        const imgList = [];
        // 匹配用的正则表达式，前半部分匹配 md 形式图片引用，后半部分匹配 HTML 形式
        const imgRegex = /((?<=!\[.*\]\()http(s)??.*?(?=\)))|((?<=<img.*src=")http(s)??.*?(?=".*>))/gi;

        for (let imgUrl of content.matchAll(imgRegex)) {
            imgUrl = imgUrl[0];
            console.log(`Downloading img: ${imgUrl}`);
            try {
                await this._storager.savePicByUrl(imgUrl, picPathList);
            }catch (e) {
                console.error(e.toString());
            }
        }
    }

}

module.exports = Backuper;