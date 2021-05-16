var v;
// v.l2d.models
$(document).ready(() => {
    v = new Viewer('model');
});

class Viewer 
{
    constructor (basePath)
    {
        this.l2d = new L2D(basePath);//new一个l2d.js中L2D对象
        this.canvas = $(".Canvas");//与网页的Canvas绑定
        this.selectCharacter = $(".selectCharacter");//与网页的selectCharacter绑定
        this.selectAnimation = $(".selectAnimation");//与网页的selectAnimation绑定
        //获取chardata里面，模型名称及文件位置
        let stringCharacter = "<option>Select3</option>";
        for (let val in charData) 
        {
             stringCharacter+= '<option value="' + charData[val] + '">' + val + '</option>';
        }
        this.selectCharacter.html(stringCharacter);//跟html的数据关联
        this.selectCharacter.change((event) => {
            if (event.target.selectedIndex == 0) {return;}//当选项为<option>Select</option>返回
            let name = event.target.value;//option value的值，模型文件夹名，具体moc等文件名字补全在l2d.js中操作
            this.l2d.load(name, this);
        });//改变时读入模型数据
        
        //直接读入指定模型
        this.l2d.load("tolive2d", this)
        
        this.app = new PIXI.Application(1280, 720, { backgroundColor: 0xffffff });
        let width = window.innerWidth;
        let height = (width / 16.0) * 9.0;
        this.app.view.style.width = width + "px";
        this.app.view.style.height = height + "px";
        this.app.renderer.resize(width, height);
        this.canvas.html(this.app.view);//绑定本类的canvas的html与

        this.app.ticker.add((deltaTime) => {
            if (!this.model) { return;}
            this.model.update(deltaTime);
            this.model.masks.update(this.app.renderer);
        });
        window.onresize = (event) => {
            if (event === void 0) { event = null; }
            let width = window.innerWidth;
            let height = (width / 16.0) * 9.0;
            this.app.view.style.width = width + "px";
            this.app.view.style.height = height + "px";
            this.app.renderer.resize(width, height);
            if (this.model) 
            {
                this.model.position = new PIXI.Point((width * 0.5), (height * 0.5));
                this.model.scale = new PIXI.Point((this.model.position.x * 0.06), (this.model.position.x * 0.06));
                this.model.masks.resize(this.app.view.width, this.app.view.height);
            }
            if(this.model.height <= 200) 
            {
                this.model.scale = new PIXI.Point((this.model.position.x * 0.6), (this.model.position.x * 0.6));
            }
        };
    }
    //改变画布
    changeCanvas (model)
    {
        this.app.stage.removeChildren();
        this.selectAnimation.empty();
        //创建动作按键
        model.motions.forEach((value, key) => {
            if (key != "effect") {
                let btn = document.createElement("button");
                let label = document.createTextNode(key);
                btn.appendChild(label);
                btn.className = "btn btn-secondary";
                btn.addEventListener("click", () => {
                    this.startAnimation(key, "base");
                });
                this.selectAnimation.append(btn);
            }
        });
        this.model = model;
        this.model.update = this.onUpdate; // HACK: use hacked update fn for drag support
        this.model.animator.addLayer("base", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1);
        this.app.stage.addChild(this.model);
        this.app.stage.addChild(this.model.masks);
        window.onresize();
    }
    //更新实时live2d，live2d跟随鼠标
    onUpdate (delta)
    {
        let deltaTime = 0.016 * delta;

        if (!this.animator.isPlaying) {
            let m = this.motions.get("idle");
            this.animator.getLayer("base").play(m);
        }
        this._animator.updateAndEvaluate(deltaTime);
        if (this.inDrag) 
        {
            this.addParameterValueById("ParamAngleX", this.pointerX * 30);
            this.addParameterValueById("ParamAngleY", -this.pointerY * 30);
            this.addParameterValueById("ParamBodyAngleX", this.pointerX * 10);
            this.addParameterValueById("ParamBodyAngleY", -this.pointerY * 10);
            this.addParameterValueById("ParamEyeBallX", this.pointerX);
            this.addParameterValueById("ParamEyeBallY", -this.pointerY);
        }
        if (this._physicsRig) 
        {
            this._physicsRig.updateAndEvaluate(deltaTime);
        }
        this._coreModel.update();
        let sort = false;
        for (let m = 0; m < this._meshes.length; ++m) {
            this._meshes[m].alpha = this._coreModel.drawables.opacities[m];
            this._meshes[m].visible = Live2DCubismCore.Utils.hasIsVisibleBit(this._coreModel.drawables.dynamicFlags[m]);
            if (Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
                this._meshes[m].vertices = this._coreModel.drawables.vertexPositions[m];
                this._meshes[m].dirtyVertex = true;
            }
            if (Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
                sort = true;
            }
        }
        if (sort) 
        {
            this.children.sort((a, b) => {
                let aIndex = this._meshes.indexOf(a);
                let bIndex = this._meshes.indexOf(b);
                let aRenderOrder = this._coreModel.drawables.renderOrders[aIndex];
                let bRenderOrder = this._coreModel.drawables.renderOrders[bIndex];

                return aRenderOrder - bRenderOrder;
            });
        }
        this._coreModel.drawables.resetDynamicFlags();
    }
    //开始动画
    startAnimation (motionId, layerId)
    {
        if (!this.model) 
        {
            return;
        }

        let m = this.model.motions.get(motionId);
        if (!m) 
        {
            return;
        }
        let l = this.model.animator.getLayer(layerId);
        if (!l) 
        {
            return;
        }
        l.play(m);
    }
    //删除isHit功能-点击触发motion
}
