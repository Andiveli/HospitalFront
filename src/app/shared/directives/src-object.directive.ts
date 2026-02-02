import { Directive, ElementRef, effect, input } from '@angular/core';

/**
 * Directive to set srcObject on video/audio elements
 * Usage: <video [srcObject]="mediaStream"></video>
 */
@Directive({
  selector: '[srcObject]',
  standalone: true,
})
export class SrcObjectDirective {
  srcObject = input<MediaStream | null | undefined>(null);

  constructor(el: ElementRef<HTMLVideoElement | HTMLAudioElement>) {
    effect(() => {
      const stream = this.srcObject();
      const element = el.nativeElement;

      if (stream) {
        element.srcObject = stream;

        // Auto-play when stream is set
        element.play().catch((error) => {
          // Ignore autoplay errors (usually due to browser policies)
          console.warn('Auto-play was prevented:', error);
        });
      } else {
        element.srcObject = null;
      }
    });
  }
}
