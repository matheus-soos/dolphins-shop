import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [
    MatIconModule
  ],
  selector: 'app-checkout-steps',
  templateUrl: './checkout-steps.component.html',
  styleUrls: ['./checkout-steps.component.scss'],
  standalone: true
})
export class CheckoutStepsComponent {
  @Input() currentStep: number = 1;
}
