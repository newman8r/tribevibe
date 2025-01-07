import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-promo-space',
  templateUrl: './promo-space.component.html',
  styleUrls: ['./promo-space.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromoSpaceComponent implements OnInit {
  soundcloudPlayerUrl: SafeResourceUrl | null = null;
  readonly playlistUrl = 'https://soundcloud.com/bradmoontribe/sets/most-loved-moontribe-mixes';
  
  private readonly embedUrl = 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/bradmoontribe/sets/most-loved-moontribe-mixes&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.soundcloudPlayerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.embedUrl);
  }
} 