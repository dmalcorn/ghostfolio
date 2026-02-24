# Coding Conventions — Ghostfolio AI Agent Project

_Extracted from the existing Ghostfolio codebase. Follow these conventions exactly when writing or modifying code._

---

## 1. Formatting Rules (Enforced by Prettier)

These are **not optional**. Prettier runs on pre-commit hook and CI.

| Rule            | Value               |
| --------------- | ------------------- |
| Indentation     | 2 spaces (no tabs)  |
| Quotes          | Single quotes (`'`) |
| Print width     | 80 characters       |
| Trailing commas | None                |
| Line endings    | LF (Unix)           |
| Semicolons      | Always              |

### Import Ordering (Auto-sorted by `@trivago/prettier-plugin-sort-imports`)

Imports are grouped in this exact order, with blank lines between groups:

```typescript
// 1. @ghostfolio/* aliases (project code)
import { AccountService } from '@ghostfolio/api/app/account/account.service';
import { permissions } from '@ghostfolio/common/permissions';
import { GfValueComponent } from '@ghostfolio/ui/value';

// 2. Third-party packages (@nestjs, @angular, @prisma, lodash, etc.)
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Account } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

// 3. Relative imports
import { AccountService } from './account.service';
```

**Rules:**

- Never mix groups. Never put a relative import before a third-party import.
- Use `import type` for type-only imports: `import type { RequestWithUser } from '@ghostfolio/common/types';`
- Multi-line imports use one import per line, closing brace on its own line.

### HTML Attribute Ordering (Auto-sorted by `prettier-plugin-organize-attributes`)

Angular template attributes are ordered:

1. Template reference variables (`#ref`)
2. Structural directives (`@if`, `@for`, `*matRowDef`)
3. Static attributes (`class`, `mat-header-cell`)
4. Input bindings (`[value]`, `[routerLink]`)
5. Two-way bindings (`[(ngModel)]`)
6. Output bindings (`(click)`, `(selectionChange)`)

---

## 2. Naming Conventions

### Files

| Type              | Pattern                                        | Example                               |
| ----------------- | ---------------------------------------------- | ------------------------------------- |
| NestJS module     | `{feature}.module.ts`                          | `account.module.ts`                   |
| NestJS controller | `{feature}.controller.ts`                      | `account.controller.ts`               |
| NestJS service    | `{feature}.service.ts`                         | `account.service.ts`                  |
| Angular component | `{feature}.component.ts`                       | `portfolio-page.component.ts`         |
| Angular template  | `{feature}.component.html` or `{feature}.html` | `portfolio-page.html`                 |
| Angular styles    | `{feature}.component.scss` or `{feature}.scss` | `portfolio-page.scss`                 |
| Angular routes    | `{feature}-page.routes.ts`                     | `portfolio-page.routes.ts`            |
| Test file         | `{source-filename}.spec.ts`                    | `account.service.spec.ts`             |
| Storybook story   | `{component-name}.component.stories.ts`        | `accounts-table.component.stories.ts` |
| DTO               | `{action}-{entity}.dto.ts`                     | `create-order.dto.ts`                 |
| Interface         | `{name}.interface.ts`                          | `access.interface.ts`                 |
| LangChain tool    | `{tool-name}.tool.ts`                          | `portfolio-analysis.tool.ts`          |
| Verification      | `{check-name}.ts`                              | `ticker-validation.ts`                |

**All file names are kebab-case.** No exceptions.

### Code Identifiers

| Type                   | Convention                | Example                                      |
| ---------------------- | ------------------------- | -------------------------------------------- |
| Classes                | PascalCase                | `AccountService`, `GfAccountsTableComponent` |
| Angular selectors      | `gf-` prefix, kebab-case  | `gf-accounts-table`, `gf-portfolio-page`     |
| Angular class names    | `Gf` prefix, PascalCase   | `GfAccountsTableComponent`                   |
| Variables / properties | camelCase                 | `portfolioDetails`, `baseCurrency`           |
| Constants              | SCREAMING_SNAKE_CASE      | `DEFAULT_CURRENCY`, `CACHE_TTL_INFINITE`     |
| LangChain tool names   | snake_case                | `portfolio_analysis`, `market_data`          |
| Prisma model names     | PascalCase (match schema) | `MarketData`, `SymbolProfile`                |
| Enum values            | SCREAMING_SNAKE_CASE      | `DataSource.YAHOO`, `Type.BUY`               |
| Event names            | dot.separated             | `portfolio.changed`                          |

### Context-Aware Naming (Same Concept, Different Convention by Layer)

The same identifier follows different naming rules depending on where it appears. This table prevents mixing conventions across layers.

| Context                         | Convention                          | Example                      |
| ------------------------------- | ----------------------------------- | ---------------------------- |
| File names (all layers)         | kebab-case                          | `portfolio-analysis.tool.ts` |
| TypeScript classes              | PascalCase                          | `PortfolioAnalysisTool`      |
| TypeScript variables/properties | camelCase                           | `portfolioDetails`           |
| Angular selectors               | kebab-case with `gf-` prefix        | `gf-accounts-table`          |
| NestJS controller routes        | kebab-case paths                    | `@Controller('market-data')` |
| API URL paths                   | kebab-case                          | `/api/v1/agent/chat`         |
| LangChain tool names            | snake_case (LLM convention)         | `portfolio_analysis`         |
| Prisma models & fields          | PascalCase models, camelCase fields | `MarketData.marketPrice`     |
| Database columns                | camelCase (Prisma maps directly)    | `marketPrice`, `createdAt`   |
| Environment variables           | SCREAMING_SNAKE_CASE                | `OPENROUTER_AGENT_MODEL`     |
| Exported constants              | SCREAMING_SNAKE_CASE                | `DEFAULT_CURRENCY`           |
| NestJS event names              | dot.separated lowercase             | `portfolio.changed`          |

**The most common mistake** is applying one layer's convention to another — e.g., using camelCase for a tool name (`portfolioAnalysis`) instead of snake_case (`portfolio_analysis`), or using PascalCase for a file name (`PortfolioAnalysis.tool.ts`) instead of kebab-case (`portfolio-analysis.tool.ts`).

### Path Aliases

Always use these instead of deep relative paths:

| Alias                  | Maps To                 |
| ---------------------- | ----------------------- |
| `@ghostfolio/api/*`    | `apps/api/src/*`        |
| `@ghostfolio/client/*` | `apps/client/src/app/*` |
| `@ghostfolio/common/*` | `libs/common/src/lib/*` |
| `@ghostfolio/ui/*`     | `libs/ui/src/lib/*`     |

**When to use relative imports:** Only within the same feature folder (e.g., `./account.service` inside account controller). Cross-feature or cross-layer imports must use aliases.

---

## 3. NestJS API Patterns

### Module Structure

Every feature has three files: module, controller, service. The module wires them together.

```typescript
@Module({
  controllers: [AccountController],
  exports: [AccountService],          // Only if other modules need this service
  imports: [
    ConfigurationModule,
    PrismaModule,
    // ... other required modules
  ],
  providers: [AccountService]         // Only the local service
})
export class AccountModule {}
```

**Domain modules** (in `apps/api/src/app/{feature}/`):

- Export their service so other modules can import them
- Only list local service in `providers`
- Import other modules to access their exported services

**Endpoint modules** (in `apps/api/src/app/endpoints/{feature}/`):

- Do NOT export services (they are terminal endpoints)
- Explicitly list ALL service dependencies in `providers`
- Used for standalone route handlers that compose multiple domain services

### Controller Pattern

```typescript
@Controller('account')
export class AccountController {
  public constructor(
    private readonly accountService: AccountService,
    private readonly apiService: ApiService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) {}

  @Delete(':id')
  @HasPermission(permissions.deleteAccount)
  @UseGuards(AuthGuard('jwt'), HasPermissionGuard)
  public async deleteAccount(
    @Param('id') id: string
  ): Promise<AccountModel> {
    // ...
  }
}
```

**Decorator ordering on methods:**

1. HTTP method (`@Get`, `@Post`, `@Put`, `@Delete`)
2. `@HasPermission(permissions.xxx)`
3. `@UseGuards(AuthGuard('jwt'), HasPermissionGuard)`
4. `@UseInterceptors(...)` (if needed)

**Constructor injection rules:**

- All parameters are `private readonly`
- Request injected as `@Inject(REQUEST) private readonly request: RequestWithUser`
- Domain services first, utility services second, REQUEST last

### Service Pattern

```typescript
@Injectable()
export class AccountService {
  public constructor(
    private readonly accountBalanceService: AccountBalanceService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prismaService: PrismaService
  ) {}

  // Query method — no verb prefix for simple lookups
  public async account(args: Prisma.AccountFindUniqueArgs): Promise<Account> {
    return this.prismaService.account.findUnique(args);
  }

  // Plural for collections
  public async accounts(params: {
    where?: Prisma.AccountWhereInput;
    orderBy?: Prisma.AccountOrderByWithRelationInput;
  }): Promise<Account[]> {
    return this.prismaService.account.findMany(params);
  }

  // CRUD operations use full verb
  public async createAccount(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prismaService.account.create({ data });
  }

  public async deleteAccount(where: Prisma.AccountWhereUniqueInput): Promise<Account> {
    return this.prismaService.account.delete({ where });
  }
}
```

**Method naming:**

- Simple lookups: noun only (`account()`, `accounts()`)
- CRUD: verb + noun (`createAccount()`, `updateAccount()`, `deleteAccount()`)
- Complex queries: `get` + description (`getCashDetails()`, `getAccounts()`)

**Event emission:**

```typescript
this.eventEmitter.emit(
  PortfolioChangedEvent.getName(),
  new PortfolioChangedEvent({ userId: account.userId })
);
```

Events use static `getName()` method. Event class pattern:

```typescript
export class PortfolioChangedEvent {
  public constructor(private readonly data: { userId: string }) {}
  public static getName() {
    return 'portfolio.changed';
  }
  public getUserId() {
    return this.data.userId;
  }
}
```

### Error Handling

```typescript
// Standard HTTP errors — always use http-status-codes library
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

throw new HttpException(
  getReasonPhrase(StatusCodes.FORBIDDEN),
  StatusCodes.FORBIDDEN
);

// With detail object
throw new HttpException(
  {
    error: getReasonPhrase(StatusCodes.BAD_REQUEST),
    message: [error.message]
  },
  StatusCodes.BAD_REQUEST
);

// NestJS convenience exceptions for simple cases
throw new BadRequestException('Message is required');
```

**Never** use raw status codes (`403`). Always use `StatusCodes.FORBIDDEN`.

### DTO Pattern

DTOs live in `libs/common/src/lib/dtos/` and use `class-validator` + `class-transformer`:

```typescript
export class CreateOrderDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsEnum(AssetClass, { each: true })
  @IsOptional()
  assetClass?: AssetClass;

  @IsOptional()
  @IsString()
  @Transform(({ value }: TransformFnParams) =>
    isString(value) ? value.trim() : value
  )
  comment?: string;

  @IsCurrencyCode()
  currency: string;

  @IsISO8601()
  @Validate(IsAfter1970Constraint)
  date: string;

  @IsNumber()
  @Min(0)
  fee: number;
}
```

**Rules:**

- Validators before optional marker: `@IsString()` then `@IsOptional()`
- Use `@Transform` for sanitization (trimming strings)
- Custom validators use `Is` prefix (`@IsCurrencyCode()`)
- Enum validation: `@IsEnum(EnumType, { each: true })`
- Named exports only — no `export default`

### Guard and Permission Pattern

```typescript
// In controller
@HasPermission(permissions.deleteAccount)
@UseGuards(AuthGuard('jwt'), HasPermissionGuard)

// permissions.ts defines all permission strings
export const permissions = {
  accessAdminControl: 'accessAdminControl',
  accessAgentChat: 'accessAgentChat',
  createAccount: 'createAccount',
  deleteAccount: 'deleteAccount',
  // ...
};
```

### Logging

```typescript
import { Logger } from '@nestjs/common';

// In service:
Logger.error(error, 'ServiceName');

// Or as instance:
private readonly logger = new Logger(AgentService.name);
```

---

## 4. Angular Client Patterns

### Component Structure

All components are standalone with `ChangeDetectionStrategy.OnPush`:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page has-tabs' },      // CSS classes on host element
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule,
    GfValueComponent                      // Standalone component imports
  ],
  selector: 'gf-portfolio-page',         // Always gf- prefix
  styleUrls: ['./portfolio-page.scss'],
  templateUrl: './portfolio-page.html'
})
export class GfPortfolioPageComponent implements OnDestroy, OnInit {
```

**Rules:**

- `standalone: true` is NOT explicitly set — it is implicit when `imports` array is present
- Always use `ChangeDetectionStrategy.OnPush`
- Use `styleUrls` (array) and `templateUrl` (single)
- Selector prefix: `gf-`
- Class prefix: `Gf`

### Signal-Based Inputs/Outputs (Preferred for New Code)

The codebase is transitioning to signals. **New code should use signals:**

```typescript
// Signal inputs
public readonly accounts = input.required<Account[]>();
public readonly baseCurrency = input<string>();
public readonly locale = input(getLocale());              // With default
public readonly hasPermission = input(true);              // Boolean default

// Signal outputs
public readonly accountDeleted = output<string>();
public readonly accountToUpdate = output<Account>();

// ViewChild via signal
public readonly sort = viewChild.required(MatSort);

// Computed properties
protected readonly displayedColumns = computed(() => {
  const columns = ['status', 'account'];
  if (this.showActivitiesCount()) {
    columns.push('activitiesCount');
  }
  return columns;
});

protected readonly isLoading = computed(() => !this.accounts());
```

**Legacy decorator style** still exists and should not be changed when editing existing components:

```typescript
@Input() colorizeSign = false;
@Output() accessDeleted = new EventEmitter<string>();
```

### Dependency Injection

Two patterns coexist — both are acceptable:

```typescript
// Constructor injection (legacy, still common)
public constructor(
  private changeDetectorRef: ChangeDetectorRef,
  private userService: UserService
) {}

// Inject function (preferred for new code)
private readonly notificationService = inject(NotificationService);
private readonly router = inject(Router);
```

### Template Syntax

**Use modern control flow** — NOT `*ngIf`, `*ngFor`:

```html
@if (canCreateAccount) {
<div class="info-message">
  <span i18n>You are using the Live Demo.</span>
</div>
} @for (tab of tabs; track tab) { @if (tab.showCondition !== false) {
<a [routerLink]="tab.path">{{ tab.label }}</a>
} }
```

**Exception:** Material table directives still use `*` syntax because they are Material-specific:

```html
<tr *matHeaderRowDef="displayedColumns()" mat-header-row></tr>
<tr *matRowDef="let row; columns: displayedColumns()" mat-row></tr>
<tr *matFooterRowDef="displayedColumns()" mat-footer-row></tr>
```

### Subscription Management

Every component with subscriptions uses this pattern:

```typescript
private unsubscribeSubject = new Subject<void>();

public constructor(private userService: UserService) {
  this.userService.stateChanged
    .pipe(takeUntil(this.unsubscribeSubject))
    .subscribe((state) => {
      if (state?.user) {
        this.user = state.user;
        this.changeDetectorRef.markForCheck();
      }
    });
}

public ngOnDestroy() {
  this.unsubscribeSubject.next();
  this.unsubscribeSubject.complete();
}
```

### Effect Pattern (Signal-Based Components)

```typescript
public constructor() {
  effect(() => {
    this.dataSource.data = this.accounts();
  });

  effect(() => {
    this.dataSource.sort = this.sort();
  });
}
```

### SCSS Pattern

Every component's styles start with `:host { display: block; }`:

```scss
:host {
  display: block;

  a {
    color: rgba(var(--palette-primary-500), 1);

    &:hover {
      color: rgba(var(--palette-primary-300), 1);
    }
  }
}
```

**Use CSS custom properties** from the design system (e.g., `--palette-primary-500`, `--mat-toolbar-standard-height`).

### Routing

Routes are centrally defined in `@ghostfolio/common/routes/routes` and split into `publicRoutes` and `internalRoutes`.

```typescript
// Lazy loading a module's routes
{
  path: internalRoutes.portfolio.path,
  loadChildren: () =>
    import('./pages/portfolio/portfolio-page.routes').then((m) => m.routes)
}

// Lazy loading a single component
{
  canActivate: [AuthGuard],
  loadComponent: () =>
    import('./pages/api/api-page.component').then((c) => c.GfApiPageComponent),
  path: internalRoutes.api.path,
  title: internalRoutes.api.title
}
```

### Internationalization

Use Angular's `i18n` attribute and `$localize` template tag:

```html
<ng-container i18n>Name</ng-container>
```

```typescript
'✅ ' + $localize`Link has been copied to the clipboard`;
```

### Icons

Ionicons added at component construction:

```typescript
public constructor() {
  addIcons({ analyticsOutline, calculatorOutline, pieChartOutline });
}
```

---

## 5. Prisma Usage Patterns

### Service Injection

```typescript
@Injectable()
export class MarketDataService {
  public constructor(private readonly prismaService: PrismaService) {}
}
```

### Query Patterns

```typescript
// Single record
this.prismaService.marketData.findFirst({
  where: { dataSource, symbol, date: resetHours(date) }
});

// Single by primary key
this.prismaService.tag.findUnique({
  where: tagWhereUniqueInput
});

// Partial fields
this.prismaService.marketData.findFirst({
  select: { date: true, marketPrice: true },
  orderBy: [{ marketPrice: 'desc' }],
  where: { dataSource, symbol }
});

// Collection with complex filter
this.prismaService.marketData.findMany({
  skip,
  take,
  orderBy: [{ date: 'asc' }, { symbol: 'asc' }],
  where: {
    date: dateQuery,
    OR: assetProfileIdentifiers.map(({ dataSource, symbol }) => ({
      dataSource,
      symbol
    }))
  }
});

// With relations
this.prismaService.tag.findMany({
  include: {
    _count: {
      select: { activities: { where: { userId } } }
    }
  },
  orderBy: { name: 'asc' },
  where: { OR: [{ userId }, { userId: null }] }
});
```

### CRUD Patterns

```typescript
// Create
this.prismaService.tag.create({ data });

// Update with relation set
this.prismaService.order.update({
  data: {
    tags: { set: tags.map((tag) => ({ id: tag.id })) }
  },
  where: { id }
});

// Upsert
this.prismaService.property.upsert({
  create: { key, value },
  update: { value },
  where: { key }
});

// Delete
this.prismaService.property.delete({ where: { key } });
```

### Type Imports

```typescript
import { Prisma, DataSource, MarketData, Tag } from '@prisma/client';

// Aliased enum (when name conflicts)
import { Type as ActivityType } from '@prisma/client';

// Usage in method signatures
public async createTag(data: Prisma.TagCreateInput): Promise<Tag> { ... }
public async accounts(params: {
  where?: Prisma.AccountWhereInput;
  orderBy?: Prisma.AccountOrderByWithRelationInput;
}): Promise<Account[]> { ... }
```

---

## 6. Testing Patterns

### Test File Location

Tests are co-located with source: `account.service.ts` → `account.service.spec.ts`

### API Service Tests

```typescript
import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';

// Mock at module level with jest.mock
jest.mock('@ghostfolio/api/services/market-data/market-data.service', () => {
  return {
    MarketDataService: jest.fn().mockImplementation(() => ({
      get: (date: Date, symbol: string) => {
        return Promise.resolve<MarketData>({
          date,
          symbol,
          marketPrice: 1847.839966,
          // ...full mock object
        });
      }
    }))
  };
});

describe('CurrentRateService', () => {
  let currentRateService: CurrentRateService;

  beforeAll(async () => {
    // Manual instantiation with null for unused deps
    const propertyService = new PropertyService(null);
    currentRateService = new CurrentRateService(
      new DataProviderService(null, [], null, null, propertyService, null),
      new MarketDataService(null),
      null,
      null
    );
  });

  it('getValues', async () => {
    expect(
      await currentRateService.getValues({ ... })
    ).toMatchObject<GetValuesObject>({ ... });
  });
});
```

### NestJS Module Tests

```typescript
describe('FireCalculatorService', () => {
  let service: FireCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FireCalculatorService]
    }).compile();

    service = module.get<FireCalculatorService>(FireCalculatorService);
  });

  it('should calculate periods to retire', async () => {
    expect(periodsToRetire).toBe(9);
  });
});
```

### Angular Component Tests

```typescript
describe('GfHistoricalMarketDataEditorComponent', () => {
  let component: GfHistoricalMarketDataEditorComponent;
  let fixture: ComponentFixture<GfHistoricalMarketDataEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GfHistoricalMarketDataEditorComponent], // Standalone component
      providers: [
        FormBuilder,
        { provide: DataService, useValue: {} }, // Empty mock
        {
          provide: DeviceDetectorService,
          useValue: {
            deviceInfo: signal({ deviceType: 'desktop' })
          }
        },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GfHistoricalMarketDataEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Guard Tests

```typescript
describe('HasPermissionGuard', () => {
  let guard: HasPermissionGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    guard = new HasPermissionGuard(reflector);
  });

  // Helper functions for mock setup
  function setupReflectorSpy(returnValue: string) {
    jest.spyOn(reflector, 'get').mockReturnValue(returnValue);
  }

  function createMockExecutionContext(permissions: string[]) {
    return new ExecutionContextHost([{ user: { permissions } }]);
  }

  it('should deny access without permission', () => {
    setupReflectorSpy('required-permission');
    expect(() => guard.canActivate(noPermissions)).toThrow(HttpException);
  });
});
```

### Common Library Tests

```typescript
describe('Helper', () => {
  describe('Extract number from string', () => {
    it('Get decimal number', () => {
      expect(extractNumberFromString({ value: '999.99' })).toEqual(999.99);
    });
  });

  describe('Get number format group', () => {
    let languageGetter: jest.SpyInstance<string, [], any>;

    beforeEach(() => {
      languageGetter = jest.spyOn(window.navigator, 'language', 'get');
    });

    it('Get de-CH format', () => {
      languageGetter.mockReturnValue('de-CH');
      expect(getNumberFormatGroup()).toEqual('\u2019');
    });
  });
});
```

### Testing Rules

- **API tests**: Node environment, `ts-jest`, manual or NestJS `Test.createTestingModule`
- **UI tests**: jsdom environment, `jest-preset-angular`, `TestBed.configureTestingModule`
- **Common lib tests**: Default jsdom, `ts-jest`
- Mock unused dependencies with `null` for simple cases
- Use `{ provide: Service, useValue: {} }` for Angular service mocks
- Standard Jest matchers: `toEqual()`, `toBe()`, `toThrow()`, `toMatchObject()`

---

## 7. LangChain Agent Patterns (New Code for This Project)

These patterns are defined in the architecture document and should be followed for all agent-related code.

### Tool Definition

```typescript
// tools/portfolio-analysis.tool.ts
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

interface ToolContext {
  userId: string;
  baseCurrency: string;
}

export function createPortfolioAnalysisTool(
  context: ToolContext,
  portfolioService: PortfolioService
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'portfolio_analysis', // snake_case tool names
    description: '...',
    schema: z.object({
      /* ... */
    }),
    func: async (input) => {
      // ALWAYS use context.userId — NEVER accept userId from input
      return JSON.stringify(result); // Tools always return strings
    }
  });
}
```

**Rules:**

- Export a factory function: `create{Name}Tool(context, ...services)`
- `ToolContext` as first parameter (contains `userId`, `baseCurrency` from JWT)
- Zod schemas for input validation
- Tool names: `snake_case` (LLM convention)
- File names: `kebab-case.tool.ts` (Ghostfolio convention)
- Return `JSON.stringify()` — tools always return strings

### Error Handling in Tools

```typescript
func: async (input) => {
  try {
    const result = await portfolioService.getDetails(/* ... */);
    return JSON.stringify(result);
  } catch (error) {
    // Return error as string — let LLM handle it conversationally
    return JSON.stringify({ error: error.message });
  }
};
```

**Three-tier error handling:**

- Tool-level: try/catch, return error as JSON string
- Agent-level: HTTP 200 with error in response body
- System-level: HTTP 500 via standard NestJS exception handling

---

## 8. Common Library Patterns

### Barrel Exports

DTOs and interfaces use barrel files (`index.ts`):

```typescript
// libs/common/src/lib/dtos/index.ts
import { CreateAccountDto } from './create-account.dto';
import { CreateOrderDto } from './create-order.dto';

export { CreateAccountDto, CreateOrderDto };
```

Import from the barrel, not individual files:

```typescript
// Good
import { CreateOrderDto, UpdateOrderDto } from '@ghostfolio/common/dtos';

// Bad — don't import from individual DTO files
import { CreateOrderDto } from '@ghostfolio/common/dtos/create-order.dto';
```

### Constants

Constants live in `@ghostfolio/common/config`:

```typescript
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_PAGE_SIZE = 50;
export const CACHE_TTL_INFINITE = 0;
export const DATA_GATHERING_QUEUE = 'DATA_GATHERING_QUEUE';
```

### Helper Functions

Pure functions in `@ghostfolio/common/helper`:

```typescript
export const DATE_FORMAT = 'yyyy-MM-dd';

export function calculateBenchmarkTrend({
  days,
  historicalData
}: {
  days: number;
  historicalData: MarketData[];
}): BenchmarkTrend {
  // ...
}
```

Use named parameter objects for functions with more than 2 parameters.

---

## 9. TypeScript Configuration Rules

These are enforced by the compiler and will cause build failures:

| Setting              | Value     | Impact                                                     |
| -------------------- | --------- | ---------------------------------------------------------- |
| `strict`             | `false`   | Do not add strict-mode annotations                         |
| `noUnusedLocals`     | `true`    | Remove unused variables or prefix with `_`                 |
| `noUnusedParameters` | `true`    | Remove unused params or prefix with `_`                    |
| `target`             | `es2015`  | Do not use ES2020+ features (e.g., `??=`, top-level await) |
| `moduleResolution`   | `bundler` | Works with both CJS and ESM imports                        |

---

## 10. Pre-Implementation Checklist

**Before writing any code, complete these steps:**

1. **Read the story or task specification in full.** Do not start coding from the title alone. The spec contains file lists, acceptance criteria, and patterns you need.

2. **Read the existing files you will modify.** Understand the current patterns before changing anything. If a service already has 20 methods following a pattern, your new method must follow the same pattern.

3. **Check `gauntlet_docs/techstack-approved-versions.md`** before installing or upgrading any dependency. Use the exact version listed. If a package is not listed, ask before adding it.

4. **Check `gauntlet_docs/architecture.md`** for architectural decisions that constrain your implementation. Do not make architecture choices that contradict existing ADRs.

5. **Check this conventions document** for the specific patterns in the layer you're working in (NestJS, Angular, Prisma, LangChain).

6. **Verify your file goes in the right location.** New agent code goes in `apps/api/src/app/endpoints/agent/`. New DTOs go in `libs/common/src/lib/dtos/`. New interfaces go in `libs/common/src/lib/interfaces/`. Do not create new top-level directories.

---

## 11. Agent Teams File Ownership Rules

**When using Agent Teams for parallel development, these rules are CRITICAL.**

### Ownership Boundaries

| Area                    | Owner                 | Path                                                           |
| ----------------------- | --------------------- | -------------------------------------------------------------- |
| Agent module (all code) | Agent Dev             | `apps/api/src/app/endpoints/agent/**`                          |
| App module registration | Lead                  | `apps/api/src/app/app.module.ts`                               |
| Common DTOs/interfaces  | Lead (or coordinated) | `libs/common/src/lib/dtos/`, `libs/common/src/lib/interfaces/` |
| Permissions             | Lead                  | `libs/common/src/lib/permissions.ts`                           |
| Package dependencies    | Lead                  | `package.json`, `package-lock.json`                            |
| Environment config      | Lead                  | `.env`, `.env.example`                                         |
| Eval test data          | Agent Dev             | `apps/api/src/app/endpoints/agent/agent.eval-data.json`        |
| Documentation           | Lead                  | `gauntlet_docs/`, `CLAUDE.md`                                  |

### Rules

1. **Never modify files outside your ownership boundary.** If you need a change in a file you don't own, message the owning teammate with the specific change needed and why.

2. **Shared read-only files:** Any teammate can read any file for context. Reading is always allowed. Writing is restricted to the owner.

3. **When boundaries overlap** (e.g., adding a new permission requires both `permissions.ts` and agent code), the Lead coordinates the shared-file change, then the Agent Dev implements the consuming code.

4. **If you discover a bug in another teammate's code**, message them with the file, line, and description. Do not fix it yourself.

5. **Coordinate on barrel exports.** If you add a new DTO or interface to a barrel file (`index.ts`), message the Lead so concurrent edits don't conflict.

---

## 12. Anti-Patterns — What NOT to Do

These are common AI agent mistakes, many learned the hard way on prior projects. Avoid them.

### File and Structure Mistakes

1. **Create utility files or helpers that don't exist yet.** If there's no `utils.ts` file, don't create one. Put the code where it belongs in the existing structure.

2. **Create barrel files where none exist.** Only `libs/common/src/lib/dtos/` and `libs/common/src/lib/interfaces/` use barrel exports. Other folders import directly.

3. **Create new modules for DTOs or interfaces.** DTOs go in `libs/common/src/lib/dtos/`. Interfaces go in `libs/common/src/lib/interfaces/`. Agent-specific interfaces can go in `agent/interfaces/`.

4. **Create test files in a separate `__tests__` directory.** Tests are co-located with source files.

5. **Create files in the wrong location.** Every file type has a defined home (see Section 2 and the architecture doc). If you are unsure where a file goes, check existing files of the same type.

6. **Modify files outside your ownership boundary** when working in Agent Teams. Read them for context, but message the owner for changes.

### Code Style Mistakes

7. **Add abstractions for one-time operations.** Three similar lines of code are better than a premature abstraction.

8. **Mix import groups.** Prettier will reject it, but don't create the mess in the first place.

9. **Use `export default`.** The entire codebase uses named exports exclusively.

10. **Use raw HTTP status codes.** Always use `StatusCodes.FORBIDDEN`, never `403`.

11. **Add `standalone: true` explicitly.** Angular 19+ treats components with `imports` as standalone implicitly. Don't add it.

12. **Use `*ngIf` or `*ngFor` in new templates.** Use `@if` and `@for` control flow syntax. Exception: Material table directives (`*matRowDef`, etc.).

13. **Add trailing commas.** Prettier is configured with `trailingComma: "none"`.

14. **Use `console.log` for logging.** Use NestJS `Logger` class on the backend.

15. **Mix naming conventions across layers.** Tool names are snake_case. File names are kebab-case. Classes are PascalCase. See the Context-Aware Naming table in Section 2.

### Scope and Behavior Mistakes

16. **Add docstrings, comments, or type annotations to code you didn't change.** Only modify what was asked for.

17. **Forget to emit events after mutations.** When modifying portfolio-related data, emit the appropriate event via `EventEmitter2`.

18. **Accept `userId` as a tool input parameter.** User identity comes from JWT context, never from LLM input. This is a security requirement.

19. **Install or upgrade dependencies without checking `gauntlet_docs/techstack-approved-versions.md`.** Every package has an approved version. Use it exactly.

20. **Invent new architectural patterns.** Follow existing patterns in the codebase. If the codebase uses factory functions for tools, you use factory functions for tools. If it uses `@Module` for DI, you use `@Module`. Do not introduce alternative patterns even if they seem "better."

21. **Over-engineer or add features that were not requested.** A task to add one tool does not mean you should also add a tool registry, plugin system, or configuration layer. Build exactly what was asked for.

22. **Start implementing before reading the full story/spec.** The spec contains file lists, acceptance criteria, and specific patterns. Coding from the title alone leads to rework.

23. **Refactor or "clean up" existing code while implementing a feature.** Stay focused on the task. If you notice something worth improving, note it separately — do not mix it into the current change.

24. **Make architectural decisions that contradict the architecture document.** If the architecture says "single agent with tool routing," do not build a multi-agent system. If it says "Redis for memory," do not use PostgreSQL.

---

## Cross-References

- **Architecture decisions:** `gauntlet_docs/architecture.md`
- **Approved dependency versions:** `gauntlet_docs/techstack-approved-versions.md`
- **Brownfield system docs:** `docs/index.md`
- **Sprint plan and status:** `gauntlet_docs/epics.md`
