var durandalSyntax = {};

var lastIf = null;

function trim(string) {
    return string == null ? '' :
        string.trim ?
            string.trim() :
            string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
}

var attributeBindingOriginal
  = ko.punches.attributeInterpolationMarkup.attributeBinding;

durandalSyntax.attributeBinding = function(name, value, node, bindAtt) {
  var matches = [];
  if(name == 'value'){
    return "value:" + value + ",valueUpdate:'keyup'";
  }
  else if(name == 'style'){
    return "attr.style: " + value;
  }
  else if(name == 'if' || name == 'repeat'){
    var isNgIf = name == 'if';
    var matches, ngRepeatAs = 'row';
    if(matches = value.match(/(\w+?)\s+?as\s+?(\w+)/)){
      ngRepeatAs = matches[2];
      value = matches[1];
    }
    var ownerDocument = node ? node.ownerDocument : document,
    closeComment = ownerDocument.createComment("/ko"),
    openComment = ownerDocument.createComment(
      isNgIf ? "ko if:" + value :
      "ko foreach:{data:" + value + ",as:'" + ngRepeatAs + "'}"
    );
    node.parentNode.insertBefore(openComment, node);
    node.parentNode.insertBefore(closeComment, node.nextSibling);
    if(//false &&
       !isNgIf){
        node.parentNode.insertBefore(ownerDocument.createComment('ko with:$parent'), node);
        node.parentNode.insertBefore(ownerDocument.createComment('/ko'), node.nextSibling); // insertAfter
    }
    return isNgIf ? "with:$data" : "with:$data";
  }
//  else if(name == 'active'){
//    return "css:{'active':" + value + "}";
//  } 
  if(bindAtt){
    var attrName = name.replace(/-([a-z])/g, function(m) {
      return m[1].toUpperCase();
    });
    name = attrName;
//    if (ko.getBindingHandler(name)) {
//        return name + ':' + value;
//    } else {
//        return 'attr.' + name + ':' + value;
//    }
//    return attrName + ':' + value;
  }
  if(['optionsText', 'optionsValue', 'optionsCaption'].indexOf(name) !== -1){
    return name + ':' + value;
  }
  return attributeBindingOriginal(name, value, node);
};

var wrapExpressionOriginal = ko.punches.interpolationMarkup.wrapExpression;

durandalSyntax.wrapExpression = function(expressionText, node) {
    var ownerDocument = node ? node.ownerDocument : document,
        closeComment = ownerDocument.createComment("/ko"),
        firstChar = expressionText[0];

  if(expressionText == 'else' && lastIf){
    return [ closeComment, ownerDocument.createComment("ko ifnot:" + lastIf) ];
  }
  var controls = [
      ['each', 'foreach'],
      ['with', 'with'],
      ['if', 'if']
  ];


  if (firstChar === '#') {
    for (var i = 0; i < controls.length; i++) {
        var templateSyntax = controls[i][0];
        var koSyntax = controls[i][1];
        // {{#if true}} {{#each arr}} {{/each}} {{/if}}
        if (expressionText.indexOf(firstChar + templateSyntax) === 0) {
          expressionText = expressionText.replace(firstChar + templateSyntax, '');
          expressionText = trim(expressionText);
          if(templateSyntax == 'if'){
              lastIf = expressionText;
          }
          return [ ownerDocument.createComment("ko " + koSyntax
                                               + ":" + expressionText) ];
        }
        if (expressionText.indexOf('/' + templateSyntax) === 0) {
          if(templateSyntax == 'if'){
              lastIf = null;
          }
          return [ closeComment ];
        }
    }
  }

  return wrapExpressionOriginal(expressionText, node);
};

var attributePreprocessorOriginal
  = ko.punches.attributeInterpolationMarkup.preprocessor;

var dataBind = 'data-bind';
durandalSyntax.attributePreprocessor = function(node) {
  if (node.nodeType === 1 && node.attributes.length) {
    var dataBindAttribute = node.getAttribute(dataBind);
    var eventsAttrs = [];
		var bindAttrs = [];
    for (var attrs = node.attributes, i = attrs.length-1; i >= 0; --i) {
      var attr = attrs[i];
      if (!(attr.specified && attr.name != dataBind)) {
        continue;
      }

      var eventCb = attr.name.match(/^on-(.+)/);
      var bindAtt = attr.name.match(/^bind-(.+)/);
      if(!bindAtt){
        bindAtt = attr.name.match(/^\[(.+?)\]$/);
      }
      if(!eventCb){
        eventCb = attr.name.match(/^\((.+?)\)$/);
      }
      if(attr.name == 'if' || attr.name == 'repeat' || attr.name == 'active'){
        node.removeAttributeNode(attr);
        continue;
      }
      else if(eventCb){
          eventsAttrs.push(eventCb[1] + ': function(){ ' + attr.value + ' }');
          node.removeAttributeNode(attr);
      }
      else if (bindAtt) {
          var attrValue = attr.value;
          var attrName = bindAtt[1];

            if (attrValue) {
                var attrBinding =
                // ko.punches.attributeInterpolationMarkup
                //    .attributeBinding(attrName, attrValue, node)  || 
                durandalSyntax.attributeBinding(attrName, attrValue, node, true);
                if (!dataBindAttribute) {
                    dataBindAttribute = attrBinding
                } else {
                    dataBindAttribute += ',' + attrBinding;
                }
                node.setAttribute(dataBind, dataBindAttribute);
                node.removeAttributeNode(attr);
            }
        }
      }
      if(eventsAttrs.length){
        var eventBinding = 'event: {' + eventsAttrs.join(', ') + '}';
        if(!dataBindAttribute){
          dataBindAttribute = eventBinding;
        }
        else {
          dataBindAttribute += ',' + eventBinding;
        }
        node.setAttribute(dataBind, dataBindAttribute);
      }
    return attributePreprocessorOriginal(node);
  }
}

var interpolationPreprocessorOriginal = ko.punches.interpolationMarkup.preprocessor;

durandalSyntax.interpolationPreprocessor = function(node){
  var widgetName;
    if(node.localName){
      var localName = node.localName.toLowerCase();
      widgetName = localName.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    }
    if(widgetName && ko.getBindingHandler(widgetName)){
      var widgetSettings = '{', keyString;
      for(var i = 0; i < node.attributes.length; i++){
        var attr = node.attributes[i];
        var bindAtt = attr.name.match(/^bind-(.+)/);
        if(!bindAtt){
          bindAtt = attr.name.match(/^\[(.+?)\]$/);
        }
        if(bindAtt){
          keyString = bindAtt[1];
          keyString = keyString.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
          widgetSettings += (i == 0 ? '' : ',') +
            keyString + ':' + attr.nodeValue;
        }
      }
      widgetSettings += '}';
      var element = document.createElement('div');
//      alert(widgetName + ': ' + widgetSettings);
      element.setAttribute('data-bind', widgetName + ': ' + widgetSettings);
//      alert(element.getAttribute('data-bind'));
      if (node.parentNode) {
        node.parentNode.insertBefore(element, node);
        node.parentNode.removeChild(node);
      }
      return [element];
    }
    return interpolationPreprocessorOriginal(node);
}

ko.punches.interpolationMarkup.wrapExpression
  = durandalSyntax.wrapExpression;
ko.punches.attributeInterpolationMarkup.attributeBinding
  = durandalSyntax.attributeBinding;

ko.punches.attributeInterpolationMarkup.preprocessor
  = durandalSyntax.attributePreprocessor;

ko.punches.interpolationMarkup.preprocessor
  = durandalSyntax.interpolationPreprocessor;
