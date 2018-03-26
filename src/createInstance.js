
import { returnFalse } from "./util";
import { Refs } from "./Refs";

export function createInstance(fiber, context) {
    let updater = {
        _mountOrder: Refs.mountOrder++,
        enqueueSetState: returnFalse,
        _isMounted: returnFalse
    };
    let { props, type, tag } = fiber,
        isStateless = tag === 1,
        lastOwn = Refs.currentOwner,
        instance,
        lifeCycleHook;
    try {
        if (isStateless) {
            instance = {
                refs: {},
                __proto__: type.prototype,
                __init__: true,
                props,
                context,
                render: function f() {
                    let a = type(this.props, this.context);
                    if (a && a.render) {
                        //返回一带render方法的纯对象，说明这是带lifycycle hook的无狀态组件
                        //需要对象里的hook复制到instance中
                        lifeCycleHook = a;
                        return this.__init__ ? null : a.render.call(this);
                    } //这是一个经典的无狀态组件
                    return a;
                }
            };

            Refs.currentOwner = instance;
            if (type.isRef) {
                instance.render = function() {
                    //  delete this.updater._hasRef;
                    return type(this.props, this.ref);
                };
            } else {
                fiber.child = instance.render();
                if (lifeCycleHook) {
                    for (let i in lifeCycleHook) {
                        if (i !== "render") {
                            instance[i] = lifeCycleHook[i];
                        }
                    }
                    lifeCycleHook = false;
                } else {
                    fiber._willReceive = false;
                    fiber._isStateless = true;
                }
                delete instance.__init__;
            }
        } else {
            //有狀态组件
            instance = new type(props, context);
        }
    } catch (e) {
        instance = {};
    } finally {
        Refs.currentOwner = lastOwn;
    }
    fiber.stateNode = instance;
    instance.updater = updater;
    return instance;
}