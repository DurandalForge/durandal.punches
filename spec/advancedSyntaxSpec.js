describe('Advanced Syntax', function(){
  beforeEach(jasmine.prepareTestNode);

  describe('Template markup', function(){

    var savePreprocessNode = ko.bindingProvider.instance.preprocessNode;
    beforeEach(ko.punches.interpolationMarkup.enable);
    afterEach(function() { ko.bindingProvider.instance.preprocessNode = savePreprocessNode; });

    it('Should replace {{#if}} {{else}} to ko:if and ko:ifnot', function(){
      var model = {good: ko.observable(true)};
      testNode.innerText = "hello {{#if good}}good{{else}}bad{{/if}} world!";
      ko.applyBindings(model, testNode);
      expect(testNode).toContainText("hello good world!");
      expect(testNode).toContainHtml("hello <!--ko if:good-->good<!--/ko--><!--ko ifnot:good--><!--/ko-->world!");
      model.good(false);
      expect(testNode).toContainText("hello bad world!");
      expect(testNode).toContainHtml("hello <!--ko if:good--><!--/ko--><!--ko ifnot:good-->bad<!--/ko-->world!");
    });

    it('Should replace {{#each}} to ko:foreach', function(){
      var model = {arr: ko.observableArray([{name: 'a'}, {name: 'b'}])};
      testNode.innerText = "hello {{#each arr}}{{name}} and {{/each}}c!";
      ko.applyBindings(model, testNode);
      expect(testNode).toContainText("hello a and b and c!");
      expect(testNode).toContainHtml("hello <!--ko foreach:arr--><!--ko text:name-->a<!--/ko-->and <!--ko text:name-->b<!--/ko-->and <!--/ko-->c!");
    });

    it('Should replace {{#with}} to ko:with', function(){
      var model = {person: {firstName: 'Sam'}};
      testNode.innerText = "hello {{#with person}}{{firstName}}{{/with}}!";
      ko.applyBindings(model, testNode);
      expect(testNode).toContainText("hello Sam!");
      expect(testNode).toContainHtml("hello <!--ko with:person--><!--ko text:firstname-->sam<!--/ko--><!--/ko-->!");
    });

  });

  describe("bind-attr markup", function() {

    beforeEach(jasmine.prepareTestNode);

    var savePreprocessNode = ko.bindingProvider.instance.preprocessNode;
    beforeEach(ko.punches.attributeInterpolationMarkup.enable);
    afterEach(function() { ko.bindingProvider.instance.preprocessNode = savePreprocessNode; });

    it('Should work with constant expressions', function() {
      testNode.innerHTML = '<div bind-title="\'hello \' + \'world!\'"></div>';
//        ko.applyBindings({name: 'Dummy'}, testNode);
      ko.applyBindings(null, testNode);
      expect(testNode.childNodes[0].title).toEqual("hello world!");
    });

    it('Should replace properties in view model', function() {
      testNode.innerHTML = '<div bind-title="\'hello \' + name"></div>';
      ko.applyBindings({name: 'Dummy'}, testNode);
      expect(testNode.childNodes[0].title).toEqual("hello Dummy");
    });

    it('Should be bidirectional for observables', function() {
      var model = {name: ko.observable('Dummy')};
      testNode.innerHTML = '<div bind-title="name"></div>';
      ko.applyBindings(model, testNode);
      expect(testNode.childNodes[0].title).toEqual("Dummy");
      model.name('Tummy');
      expect(testNode.childNodes[0].title).toEqual("Tummy");
    });

  });

  describe("on-event markup", function() {

    beforeEach(jasmine.prepareTestNode);

    var savePreprocessNode = ko.bindingProvider.instance.preprocessNode;
    beforeEach(ko.punches.attributeInterpolationMarkup.enable);
    afterEach(function() { ko.bindingProvider.instance.preprocessNode = savePreprocessNode; });

    it('Should work with expressions', function() {
      var model = {total: 0};
      testNode.innerHTML = '<button on-click="total = 10; console.log(total);">hey</button>';
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(model.total).toEqual(10);
    });

    it('Should call functions on the viewmodel, with context', function() {
      var model = {
        game: 'start',
        finish: function(){
          this.game = 'over';
        }
      };
      testNode.innerHTML = '<button on-click="finish()">hey</button>';
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(model.game).toEqual('over');
    });

  });
  
  ko.bindingHandlers.viewPort = ko.bindingHandlers.routerViewPort = {
  //  update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
  //    var value = valueAccessor();
  //    var valueUnwrapped = ko.utils.unwrapObservable(value);
  //  }
  };

  describe("Custom element", function() {
    beforeEach(jasmine.prepareTestNode);

    var savePreprocessNode = ko.bindingProvider.instance.preprocessNode;
    beforeEach(ko.punches.interpolationMarkup.enable);
    afterEach(function() { ko.bindingProvider.instance.preprocessNode = savePreprocessNode; });

    it('Should replace router-view-port to durandal router binding', function() {
      testNode.innerHTML = '<router-view-port></router-view-port>';
      ko.applyBindings(null, testNode);
      var outputHtml = '<div data-bind="routerviewport: {}"></div>';
      expect(testNode).toContainHtml(outputHtml);
    });
    
    it('Should replace router-view-port transition and cacheViews attributes', function() {
      testNode.innerHTML = '<router-view-port transition="\'entrance\'" cacheViews="true"></router-view-port>';
      ko.applyBindings(null, testNode);
      var outputHtml = '<div data-bind="routerviewport: {transition:\'entrance\',cacheviews:true}"></div>';
      expect(testNode).toContainHtml(outputHtml);
    });

  });
  

  describe("Angular Markup", function() {

    beforeEach(jasmine.prepareTestNode);

    var savePreprocessNode = ko.bindingProvider.instance.preprocessNode;
    beforeEach(ko.punches.attributeInterpolationMarkup.enable);
    afterEach(function() { ko.bindingProvider.instance.preprocessNode = savePreprocessNode; });

    it('Should convert ng-if to ko-if', function() {
      testNode.innerHTML = '<span bind-ng-if="isCool" ng-if>Cool</span>';
      var model = {isCool: ko.observable(true)};
      ko.applyBindings(model, testNode);
      expect(testNode.innerHTML).toEqual('<!--ko if:isCool--><span data-bind="with:$data">Cool</span><!--/ko-->');
      expect(testNode.innerText).toEqual("Cool");
      model.isCool(false);
      expect(testNode.innerHTML).toEqual('<!--ko if:isCool--><!--/ko-->');
    });

    it('Should convert ng-active to css:{active:', function() {
      testNode.innerHTML = '<div class="demo" bind-ng-active="isActive" ng-active></div>';
      var model = {isActive: ko.observable(true)};
      ko.applyBindings(model, testNode);
      expect(testNode.childNodes[0].className).toMatch(/demo/);
      expect(testNode.childNodes[0].className).toMatch(/active/);
      model.isActive(false);
      expect(testNode.childNodes[0].className).toBe('demo');
    });

    it('Should convert ng-repeat to ko:foreach', function() {
      var model = {people: ko.observableArray()};
      testNode.innerHTML = '<div bind-ng-repeat="people" ng-repeat>{{row.name}}</div>';
//      ko.punches.attributeInterpolationMarkup.preprocessor(testNode);
      ko.applyBindings(model, testNode);
      expect(testNode.innerHTML).toEqual("<!--ko foreach:{data:people,as:'row'}--><!--/ko-->");
      model.people([
        {name: 'Alex', age: 30},
        {name: 'Jane', age: 14}
      ]);
      expect(testNode.childNodes[0].textContent).toEqual("ko foreach:{data:people,as:'row'}");
//      console.log(Object.keys(testNode.childNodes[1]));
      expect(testNode.childNodes[1].textContent).toEqual('ko with:$parent');
      console.log(testNode.childNodes);
      expect(testNode.childNodes[2].outerHTML).toEqual('<div data-bind="with:$data">{{row.name}}</div>');
    });

  });

});
