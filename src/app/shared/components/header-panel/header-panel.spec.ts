import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPanel } from './header-panel';

describe('HeaderPanel', () => {
  let component: HeaderPanel;
  let fixture: ComponentFixture<HeaderPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
