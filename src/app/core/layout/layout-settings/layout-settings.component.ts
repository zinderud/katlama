import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Account } from '../../models/user.model';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-layout-settings',
  templateUrl: './layout-settings.component.html',
  styleUrls: ['./layout-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSettingsComponent implements OnInit {
  @Input() account?: Account;
  isDarkThemeToggled = false;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private readonly themeService: ThemeService,
    private readonly userService: UserService,
    private readonly dialog: MatDialog,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isDarkThemeToggled = this.themeService.isDarkToggled;
  }

  async onImportImage($event: Event | DataTransfer): Promise<void> {
    const selectedNewImage = await this.getFileFromEvent($event);
    this.userService.update({
      ...(this.account as Account),
      avatar: selectedNewImage,
    });
    this.changeDetectorRef.markForCheck();
  }

  onLogOut(): void {
    this.userService.delete();
  }

  onOpenDialog(templateRef: TemplateRef<Component>): void {
    this.dialog.open(templateRef);
  }

  onCloseDialog(): void {
    this.dialog.closeAll();
  }

  onToggleDarkTheme(): void {
    this.themeService.toggleDark();
    this.isDarkThemeToggled = this.themeService.isDarkToggled;
  }

  private getFileFromEvent($event: Event | DataTransfer): Promise<string> {
    const event = $event as Event;
    event.preventDefault();
    const target = event.target as HTMLInputElement;
    const file = (target?.files ?? ($event as DataTransfer)?.files)[0];

    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e?.target?.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }
}
