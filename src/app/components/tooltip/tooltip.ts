import { NgModule, Directive, ElementRef, AfterViewInit, OnDestroy, HostBinding, HostListener, Input, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomHandler } from '../dom/domhandler';

@Directive({
    selector: '[pTooltip]',
    providers: [DomHandler]
})
export class Tooltip implements AfterViewInit, OnDestroy {

    @Input() tooltipPosition: string = 'right';

    @Input() tooltipEvent: string = 'hover';

    @Input() appendTo: any = 'body';

    @Input() positionStyle: string;

    @Input() tooltipStyleClass: string;

    @Input() tooltipZIndex: string = 'auto';

    @Input("tooltipDisabled") disabled: boolean;

    @Input() escape: boolean = true;

    @Input() showDelay: number;

    @Input() hideDelay: number;

    @Input() life: number;

    container: any;

    styleClass: string;

    tooltipText: any;

    showTimeout: any;

    hideTimeout: any;

    lifeTimeout: any;

    active: boolean;

    _text: string;

    mouseEnterListener: Function;

    mouseLeaveListener: Function;

    clickListener: Function;

    focusListener: Function;

    blurListener: Function;

    resizeListener: any;

    constructor(public el: ElementRef, public domHandler: DomHandler, public zone: NgZone) { }

    ngAfterViewInit() {
        this.zone.runOutsideAngular(() => {
            if (this.tooltipEvent === 'hover') {
                this.mouseEnterListener = this.onMouseEnter.bind(this);
                this.mouseLeaveListener = this.onMouseLeave.bind(this);
                this.clickListener = this.onClick.bind(this);
                this.el.nativeElement.addEventListener('mouseenter', this.mouseEnterListener);
                this.el.nativeElement.addEventListener('mouseleave', this.mouseLeaveListener);
                this.el.nativeElement.addEventListener('click', this.clickListener);
            }
            else if (this.tooltipEvent === 'focus') {
                this.focusListener = this.onFocus.bind(this);
                this.blurListener = this.onBlur.bind(this);
                this.el.nativeElement.addEventListener('focus', this.focusListener);
                this.el.nativeElement.addEventListener('blur', this.blurListener);
            }
        });
    }

    onMouseEnter(e: Event) {
        if (!this.container) {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.remove();
            }

            this.activate();
        }
    }
    
    onMouseLeave(e: Event) {
        this.deactivate(true);
    }
    
    onFocus(e: Event) {
        this.activate();
    }
    
    onBlur(e: Event) {
        this.deactivate(true);
    }
  
    onClick(e: Event) {
        this.deactivate(true);
    }

    activate() {
        this.active = true;
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        if (this.showDelay)
            this.showTimeout = setTimeout(() => { this.show() }, this.showDelay);
        else
            this.show();

        if (this.life) {
            this.lifeTimeout = setTimeout(() => { this.deactivate(false) }, this.life);
        }
    }

    deactivate(useDelay) {
        this.active = false;
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }

        if (this.lifeTimeout) {
            clearTimeout(this.lifeTimeout);
        }

        if (this.hideDelay && useDelay)
            this.hideTimeout = setTimeout(() => { this.hide() }, this.hideDelay);
        else
            this.hide();
    }

    get text(): string {
        return this._text;
    }

    @Input('pTooltip') set text(text: string) {
        this._text = text;
        if (this.active) {
            if (this._text) {
                if (this.container && this.container.offsetParent)
                    this.updateText();
                else
                    this.show();
            }
            else {
                this.hide();
            }
        }
    }

    create() {
        this.container = document.createElement('div');

        let tooltipArrow = document.createElement('div');
        tooltipArrow.className = 'ui-tooltip-arrow';
        this.container.appendChild(tooltipArrow);

        this.tooltipText = document.createElement('div');
        this.tooltipText.className = 'ui-tooltip-text ui-shadow ui-corner-all';

        this.updateText();

        if (this.positionStyle) {
            this.container.style.position = this.positionStyle;
        }

        this.container.appendChild(this.tooltipText);

        if (this.appendTo === 'body')
            document.body.appendChild(this.container);
        else if (this.appendTo === 'target')
            this.domHandler.appendChild(this.container, this.el.nativeElement);
        else
            this.domHandler.appendChild(this.container, this.appendTo);

        this.container.style.display = 'inline-block';
    }

    show() {
        if (!this.text || this.disabled) {
            return;
        }

        this.create();
        this.align();
        this.domHandler.fadeIn(this.container, 250);

        if (this.tooltipZIndex === 'auto')
            this.container.style.zIndex = ++DomHandler.zindex;
        else
            this.container.style.zIndex = this.tooltipZIndex;

        this.bindDocumentResizeListener();
    }

    hide() {
        this.remove();
    }

    updateText() {
        if (this.escape) {
            this.tooltipText.innerHTML = '';
            this.tooltipText.appendChild(document.createTextNode(this._text));
        }
        else {
            this.tooltipText.innerHTML = this._text;
        }
    }

    align() {
        let position = this.tooltipPosition;

        switch (position) {
            case 'top':
                this.alignTop();
                if (this.isOutOfBounds()) {
                    this.alignBottom();
                }
                break;

            case 'bottom':
                this.alignBottom();
                if (this.isOutOfBounds()) {
                    this.alignTop();
                }
                break;

            case 'left':
                this.alignLeft();
                if (this.isOutOfBounds()) {
                    this.alignRight();

                    if (this.isOutOfBounds()) {
                        this.alignTop();

                        if (this.isOutOfBounds()) {
                            this.alignBottom();
                        }
                    }
                }
                break;

            case 'right':
                this.alignRight();
                if (this.isOutOfBounds()) {
                    this.alignLeft();

                    if (this.isOutOfBounds()) {
                        this.alignTop();

                        if (this.isOutOfBounds()) {
                            this.alignBottom();
                        }
                    }
                }
                break;
        }
    }

    getHostOffset() {
        if(this.appendTo === 'body' || this.appendTo === 'target') {
            let offset = this.el.nativeElement.getBoundingClientRect();
            let targetLeft = offset.left + this.domHandler.getWindowScrollLeft();
            let targetTop = offset.top + this.domHandler.getWindowScrollTop();
    
            return { left: targetLeft, top: targetTop };
        }
        else {
            return { left: 0, top: 0 };
        }
    }

    alignRight() {
        this.preAlign('right');
        let hostOffset = this.getHostOffset();
        let left = hostOffset.left + this.domHandler.getOuterWidth(this.el.nativeElement);
        let top = hostOffset.top + (this.domHandler.getOuterHeight(this.el.nativeElement) - this.domHandler.getOuterHeight(this.container)) / 2;
        this.container.style.left = left + 'px';
        this.container.style.top = top + 'px';
    }

    alignLeft() {
        this.preAlign('left');
        let hostOffset = this.getHostOffset();
        let left = hostOffset.left - this.domHandler.getOuterWidth(this.container);
        let top = hostOffset.top + (this.domHandler.getOuterHeight(this.el.nativeElement) - this.domHandler.getOuterHeight(this.container)) / 2;
        this.container.style.left = left + 'px';
        this.container.style.top = top + 'px';
    }

    alignTop() {
        this.preAlign('top');
        let hostOffset = this.getHostOffset();
        let left = hostOffset.left + (this.domHandler.getOuterWidth(this.el.nativeElement) - this.domHandler.getOuterWidth(this.container)) / 2;
        let top = hostOffset.top - this.domHandler.getOuterHeight(this.container);
        this.container.style.left = left + 'px';
        this.container.style.top = top + 'px';
    }

    alignBottom() {
        this.preAlign('bottom');
        let hostOffset = this.getHostOffset();
        let left = hostOffset.left + (this.domHandler.getOuterWidth(this.el.nativeElement) - this.domHandler.getOuterWidth(this.container)) / 2;
        let top = hostOffset.top + this.domHandler.getOuterHeight(this.el.nativeElement);
        this.container.style.left = left + 'px';
        this.container.style.top = top + 'px';
    }

    preAlign(position: string) {
        this.container.style.left = -999 + 'px';
        this.container.style.top = -999 + 'px';

        let defaultClassName = 'ui-tooltip ui-widget ui-tooltip-' + position;
        this.container.className = this.tooltipStyleClass ? defaultClassName + ' ' + this.tooltipStyleClass : defaultClassName;
    }

    isOutOfBounds(): boolean {
        let offset = this.container.getBoundingClientRect();
        let targetTop = offset.top;
        let targetLeft = offset.left;
        let width = this.domHandler.getOuterWidth(this.container);
        let height = this.domHandler.getOuterHeight(this.container);
        let viewport = this.domHandler.getViewport();

        return (targetLeft + width > viewport.width) || (targetLeft < 0) || (targetTop < 0) || (targetTop + height > viewport.height);
    }

    onWindowResize(e: Event) {
        this.hide();
    }

    bindDocumentResizeListener() {
        this.zone.runOutsideAngular(() => {
            this.resizeListener = this.onWindowResize.bind(this);
            window.addEventListener('resize', this.resizeListener);
        });
    }

    unbindDocumentResizeListener() {
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
    }

    unbindEvents() {
        if (this.tooltipEvent === 'hover') {
            this.el.nativeElement.removeEventListener('mouseenter', this.mouseEnterListener);
            this.el.nativeElement.removeEventListener('mouseleave', this.mouseLeaveListener);
            this.el.nativeElement.removeEventListener('click', this.clickListener);
        }
        else if (this.tooltipEvent === 'focus') {
            this.el.nativeElement.removeEventListener('focus', this.focusListener);
            this.el.nativeElement.removeEventListener('blur', this.blurListener);
        }

        this.unbindDocumentResizeListener();
    }

    remove() {
        if (this.container && this.container.parentElement) {
            if (this.appendTo === 'body')
                document.body.removeChild(this.container);
            else if (this.appendTo === 'target')
                this.el.nativeElement.removeChild(this.container);
            else
                this.domHandler.removeChild(this.container, this.appendTo);
        }
        
        this.container = null;
    }

    ngOnDestroy() {
        this.unbindEvents();
        this.remove();
    
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }
    
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
    }
}

@NgModule({
    imports: [CommonModule],
    exports: [Tooltip],
    declarations: [Tooltip]
})
export class TooltipModule { }
