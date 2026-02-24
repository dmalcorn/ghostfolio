import { AuthGuard } from '@ghostfolio/client/core/auth.guard';
import { internalRoutes } from '@ghostfolio/common/routes/routes';

import { Routes } from '@angular/router';

import { GfAiAgentPageComponent } from './ai-agent-page.component';

export const routes: Routes = [
  {
    canActivate: [AuthGuard],
    component: GfAiAgentPageComponent,
    path: '',
    title: internalRoutes.aiAgent.title
  }
];
