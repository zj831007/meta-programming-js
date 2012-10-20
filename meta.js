/**
 * Created with JetBrains PhpStorm.
 * User: justin
 * Date: 12-10-19
 * Time: 下午4:19
 * To change this template use File | Settings | File Templates.
 */

//http://wenku.baidu.com/view/48d916ea551810a6f52486d2.html

Form.Behavior = new Object();

Form.Behavior.DependencyManager = {
    show: function(elementId){
        return new Form.Behavior.Dependency(elementId,"show","hide");
    },
    hide: function(elementId){
        return new Form.Behavior.Dependency(elementId, "hide", "show")
    },
    enable: function(elementId){
        return new Form.Behavior.Dependency(elementId,"enable","disable");
    },
    disable: function(elementId){
        return new Form.Behavior.Dependency(elementId,"disable","enable")
    }
}

Form.Behavior.Actions = {
    "show/hide":[
       function(){
           this.element.show().removeClassName("_hidden");
       },
        function(){
            this.element.hide().addClassName("_hidden");
        }
    ],
    "enable/disable" :[
        function(){
            this.element.enable();
        },
        function(){
            this.element.disable();
        }
    ]
}
$H(Form.Behavior.Actions).each(function(pair){
    var actions = pair.key.split("/");
    actions.each(function(action, i){
        var opposingAction = action[i?0:1];
        var methodDefinition = new Template(
            "Form.Behavior.DependencyManager.#{0}=function{"+
                "return new Form.Behavior.Dependency(elementId,'#{0}','#{1}');};"
        )
        eval(methodDefinition.evaluate([action, opposingAction])); //prototype中的evaluate
        Form.Behavior.Dependency.prototype[action] = pair.value[i];
    })
})



Object.extend(Form.Behavior.Dependency.prototype, Form.Behavior.Actions);


Form.Behavior.Dependency = Class.create();
Form.Behavior.Dependency.prototype = {
    initialize : function(elementId, action, opposingAction){
        this.element = $(elementId);
        this.action = action;
        this.opposingAction = opposingAction;
    },
    when : function(elementId){
        return new Form.Behavior.DependencyTrigger(elementId, this);
    },
    checkContainedTriggers : function(){
        this.element.getElementsByClassName("dependencyTrigger").each(
            function(field){
                field.triggerObject.checkDependency();
            }
        )
    },
    doAction : function(action){
        action = action || this.action;
        this[this.action]();
        this.checkContainedTriggers();
    },
    doOpposingAction : function(){
        this[this.opposingAction]();
        this.checkContainedTriggers();
    }
}

Form.Behavior.DependencyTrigger = Class.create();
Form.Behavior.DependencyTrigger.prototype = {
    initialize : function(elementId, dependency){
        this.element = elementId;
        this.dependency = dependency;
        $(this.elementId).addClassName("dependencyTrigger").triggerObject = this;
    },
    is : function(values, inverse){
        this.values = values;
        this.inverse = inverse;
        this.addHandler();
        this.checkDependency(); //check dependency when page load
        console.log("show %s when %s is %s", this.dependency.element.id,this.element.id, this.values);
    },
    isNot:function(values){
      this.is(values, true);
    },
    addHandler : function(){
        Event.observe(this.element, "change", this.checkDependency.bind(this));
    },
    checkDependency : function(){
        console.info("checking %s for %s", this.element.id, this.values);
        var match = this.match();
        if((match && !this.inverse) || (!match && this.inverse)){
            this.dependency.doAction();
        }else{
            this.dependency.doOpposingAction();
        }
    },
    match : function(){
        var element = $(this.elementId);
        if(element.hasClassName("_hidden") || element.up("_hidden")){
            return false;
        }else{
            return this.values.split(",").indexOf($F(element))>-1;
        }
    }
}

//useage:  show("brutus").when("us-state").is("Ohio")