import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {

  override parse(value: any): Date | null {
    // Se não for string ou não tiver barra, deixa o padrão tentar ou retorna null
    if ((typeof value === 'string') && (value.indexOf('/') > -1)) {
      const str = value.split('/');

      // CORREÇÃO: Exige Dia, Mês e Ano. E o Ano deve ter 4 dígitos.
      // Isso impede que "29/1" seja aceito.
      if (str.length < 3 || str[2].length < 4) {
        return null;
      }

      const day = Number(str[0]);
      const month = Number(str[1]) - 1; // Mês começa em 0
      const year = Number(str[2]);

      // Validação básica de números
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
      }

      const dataObj = new Date(year, month, day);

      // Validação estrita (ex: impede 30/02 ou meses > 11)
      // O JS converte 30/02 para 01/03 ou 02/03 automaticamente, aqui nós bloqueamos isso.
      if (dataObj.getDate() !== day ||
          dataObj.getMonth() !== month ||
          dataObj.getFullYear() !== year) {
        return null;
      }

      return dataObj;
    }

    // Fallback para comportamento padrão (timestamp ou ISO)
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }

  // Define Domingo como primeiro dia da semana
  override getFirstDayOfWeek(): number {
    return 0;
  }
}
