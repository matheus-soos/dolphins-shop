import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'timerFormat'
})
export class TimerFormatPipe implements PipeTransform {

    transform(segundos: number): string {
        if (!segundos) return '00:00';

        const minutos = Math.floor(segundos / 60);
        const segundosRestantes = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
    }

}
