Enabling you to explore Angular 2.0 with knockout js in a Backward Compatible way.

```javascript
ko.bindingHandlers.someCoolElement = { /* ... */ };
ko.punches.enableAll();
```

```html
<div [ng-if]="people.length" class="people-links">
  <a [ng-repeat|person]="people"
     href="{{person.url}}"
     (click)="select(person)">
     {{person.fullName}}
  </a>
  <some-cool-element
    [param]="someValue"
    [another-param]="anotherValue">
  </some-cool-element>
</div>
```

is equivalent to:

```html
<!-- ko if: people.length -->
<div class="people-links">
  <!-- ko foreach: {data: people, as: 'person'} -->
    <a data-bind="
        attr: {href: person.url},
        event: {click: function(){ select(person) }}">
      <!-- ko text: person.fullName --><!-- /ko -->
    </a>
  <!-- /ko -->
  <div data-bind="someCoolElement: {
    param: someValue,
    anotherParam: anotherValue
  }"></div>
</div>
<!-- /ko -->
```

Originally started as a fork of https://github.com/mbest/knockout.punches
