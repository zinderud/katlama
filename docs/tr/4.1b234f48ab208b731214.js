(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{rZHr:function(t,e,r){"use strict";r.r(e),r.d(e,"ArticleModule",function(){return p});var n=r("ofXK"),c=r("tyNb"),o=r("lJxs"),i=r("oQ8E"),s=r("fXoL"),a=r("f4AX");let u=(()=>{class t{constructor(t,e,r){this.logService=t,this.router=e,this.userService=r}canActivate(){return this.userService.account$.pipe(Object(o.a)(t=>{var e;return!(null===(e=null==t?void 0:t.isConfirmed)||void 0===e||!e)||(this.logService.info(i.b.Guard,this.constructor.name),this.router.parseUrl("/auth/confirm-email"))}))}}return t.\u0275fac=function(e){return new(e||t)(s.Yb(i.a),s.Yb(c.b),s.Yb(a.a))},t.\u0275prov=s.Hb({token:t,factory:t.\u0275fac,providedIn:"root"}),t})();const l=[{path:"",component:(()=>{class t{ngOnInit(){}}return t.\u0275fac=function(e){return new(e||t)},t.\u0275cmp=s.Fb({type:t,selectors:[["app-article"]],decls:2,vars:0,template:function(t,e){1&t&&(s.Rb(0,"p"),s.Ac(1,"article works!"),s.Qb())},styles:[""],changeDetection:0}),t})(),canActivate:[u]}];let p=(()=>{class t{}return t.\u0275fac=function(e){return new(e||t)},t.\u0275mod=s.Jb({type:t}),t.\u0275inj=s.Ib({imports:[[n.c,c.f.forChild(l)]]}),t})()}}]);