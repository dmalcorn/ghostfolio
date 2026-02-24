import { UserService } from '@ghostfolio/client/services/user/user.service';
import {
  AgentChatMetadata,
  AgentToolCallRecord,
  AgentVerificationResult,
  User
} from '@ghostfolio/common/interfaces';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import { DataService } from '@ghostfolio/ui/services';

import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, sendOutline } from 'ionicons/icons';
import { MarkdownModule } from 'ngx-markdown';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ChatMessage {
  content: string;
  error?: boolean;
  metadata?: AgentChatMetadata;
  role: 'user' | 'agent';
  timestamp: Date;
  toolCalls?: AgentToolCallRecord[];
  verification?: AgentVerificationResult[];
}

@Component({
  host: { class: 'page' },
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    MarkdownModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TextFieldModule
  ],
  selector: 'gf-ai-agent-page',
  styleUrls: ['./ai-agent-page.scss'],
  templateUrl: './ai-agent-page.html'
})
export class GfAiAgentPageComponent
  implements AfterViewChecked, OnDestroy, OnInit
{
  @ViewChild('messagesContainer') private messagesContainer: ElementRef;

  public conversationId: string;
  public hasPermissionToAccessAgentChat: boolean;
  public isLoading = false;
  public messageInput = '';
  public messages: ChatMessage[] = [];
  public user: User;

  private shouldScrollToBottom = false;
  private unsubscribeSubject = new Subject<void>();

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private userService: UserService
  ) {
    addIcons({ refreshOutline, sendOutline });
  }

  public ngOnInit() {
    this.userService.stateChanged
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((state) => {
        if (state?.user) {
          this.user = state.user;

          this.hasPermissionToAccessAgentChat = hasPermission(
            this.user.permissions,
            permissions.accessAgentChat
          );

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  public ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  public onNewConversation() {
    this.conversationId = undefined;
    this.messages = [];
  }

  public onSendMessage() {
    const message = this.messageInput.trim();

    if (!message || this.isLoading) {
      return;
    }

    this.messages.push({
      content: message,
      role: 'user',
      timestamp: new Date()
    });

    this.messageInput = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;
    this.changeDetectorRef.markForCheck();

    this.dataService
      .chatWithAgent({
        message,
        conversationId: this.conversationId
      })
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe({
        error: (error) => {
          let errorMessage: string;

          if (error.status === 503) {
            errorMessage = $localize`AI service is currently unavailable. Please try again later.`;
          } else if (error.status === 400) {
            errorMessage = error.error?.message || $localize`Invalid request.`;
          } else {
            errorMessage = $localize`An unexpected error occurred. Please try again.`;
          }

          this.messages.push({
            content: errorMessage,
            error: true,
            role: 'agent',
            timestamp: new Date()
          });

          this.isLoading = false;
          this.shouldScrollToBottom = true;
          this.changeDetectorRef.markForCheck();
        },
        next: (response) => {
          this.conversationId = response.conversationId;

          this.messages.push({
            content: response.response,
            metadata: response.metadata,
            role: 'agent',
            timestamp: new Date(),
            toolCalls: response.toolCalls,
            verification: response.verification
          });

          this.isLoading = false;
          this.shouldScrollToBottom = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }
}
