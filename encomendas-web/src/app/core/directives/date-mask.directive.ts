import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDateMask]',
  standalone: true // <--- IMPORTANTE: Adicione isso para funcionar no seu componente Standalone
})
export class DateMaskDirective {

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInputChange(event: any) {
    let valor = this.el.nativeElement.value;
    valor = valor.replace(/\D/g, '');

    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }

    if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d)/, '$1/$2');
    }
    if (valor.length > 5) {
      valor = valor.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    }

    this.el.nativeElement.value = valor;

    if (this.control && this.control.control) {
      this.control.control.setValue(valor, { emitEvent: false });
    }
  }
}
