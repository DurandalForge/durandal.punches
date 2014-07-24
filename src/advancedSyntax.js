var advancedSyntax = {};

var lastIf = null;

function trim(string) {
    return string == null ? '' :
        string.trim ?
            string.trim() :
            string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
}

var attributeBindingOriginal
  = ko.punches.attributeInterpolationMarkup.attributeBinding;

advancedSyntax.attributeBinding = function(name, value, node) {
  if(name == 'value'){
    return "value:" + value + ",valueUpdate:'keyup'";
  }
  else if(name == 'style'){
    return "attr.style: " + value;
  }
  else if(name == 'ng-if' || name == 'ng-repeat'){
    var isNgIf = name == 'ng-if';
    var ownerDocument = node ? node.ownerDocument : document,
    closeComment = ownerDocument.createComment("/ko"),
    openComment = ownerDocument.createComment(
      isNgIf ? "ko if:" + value :
      "ko foreach:{data:" + value + ",as:'row'}"
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
  else if(name == 'ng-active'){
    return "css:{'active':" + value + "}";
  }
  return attributeBindingOriginal(name, value, node);
};

var wrapExpressionOriginal = ko.punches.interpolationMarkup.wrapExpression;

advancedSyntax.wrapExpression = function(expressionText, node) {
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
advancedSyntax.attributePreprocessor = function(node) {
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
      if(attr.name == 'ng-if' || attr.name == 'ng-repeat' || attr.name == 'ng-active'){
        node.removeAttributeNode(attr);
        continue;
      }
      else if(eventCb){
          eventsAttrs.push(eventCb[1] + ': function(){ ' + attr.value + ' }');
          node.removeAttributeNode(attr);
      }
      else if (bindAtt) {
          var attrValue = attr.value;
//          var attrName = attr.name.replace('bind-', '');
          var attrName = bindAtt[1];

            if (attrValue) {
                var attrBinding
                = ko.punches.attributeInterpolationMarkup
                    .attributeBinding(attrName, attrValue, node)
                    || advancedSyntax.attributeBinding(attrName, attrValue, node);
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

advancedSyntax.interpolationPreprocessor = function(node){
    if(node.localName == 'view-port' || node.localName == 'router-view-port'){
      var routerBinding = {};
      if(node.getAttribute('transition')){
        routerBinding.transition = node.getAttribute('transition');
      }
      if(node.getAttribute('cacheViews')){
        routerBinding.cacheViews = node.getAttribute('cacheViews') === 'true';
      }
      var element = document.createElement('div');
      element.setAttribute('data-bind', 'router: ' + JSON.stringify(routerBinding) + '');
      if (node.parentNode) {
        node.parentNode.insertBefore(element, node);
        node.parentNode.removeChild(node);
      }
      return [element];
  }
  return interpolationPreprocessorOriginal(node);
}

ko.punches.interpolationMarkup.wrapExpression
  = advancedSyntax.wrapExpression;
ko.punches.attributeInterpolationMarkup.attributeBinding
  = advancedSyntax.attributeBinding;

ko.punches.attributeInterpolationMarkup.preprocessor
  = advancedSyntax.attributePreprocessor;

ko.punches.interpolationMarkup.preprocessor
  = advancedSyntax.interpolationPreprocessor;
