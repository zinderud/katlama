import { Pipe, PipeTransform } from '@angular/core';
import { Origami } from '../models/origami';
 

@Pipe({
  name: 'origamiMediaType'
})
export class OrigamiMediaTypePipe implements PipeTransform {

  transform(value: Origami): string | undefined {
    if (!value || !value?.skylink) {
      return undefined;
    }
    if (value.mimeType && value.mimeType.indexOf('video') === 0) {
      return 'video';
    }
    if (value.mimeType && value.mimeType.indexOf('audio') === 0) {
      return 'audio';
    }
    return 'image';
  }

}
