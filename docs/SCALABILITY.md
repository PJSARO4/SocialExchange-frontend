# Social Exchange - Scalability Infrastructure

This document describes the scalable architecture for handling 10,000+ concurrent users.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Load Balancer                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────┴───────┐           ┌───────┴───────┐
            │   Web Server  │           │   Web Server  │
            │   (Next.js)   │           │   (Next.js)   │
            └───────┬───────┘           └───────┬───────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
            ┌─────────────────────┴─────────────────────┐
            │                                           │
    ┌───────┴───────┐                           ┌───────┴───────┐
    │  PostgreSQL   │                           │   Job Queue   │
    │   Database    │                           │  (Database)   │
    └───────────────┘                           └───────┬───────┘
                                                        │
                                          ┌─────────────┴─────────────┐
                                          │                           │
                                  ┌───────┴───────┐           ┌───────┴───────┐
                                  │    Worker 1   │           │    Worker 2   │
                                  └───────────────┘           └───────────────┘
```

## Components

### 1. Database Layer (PostgreSQL)

All persistent data is stored in PostgreSQL with the following models:

- **ScheduledPost**: Posts scheduled for future publishing
- **AutomationRule**: Automation rules configured by users
- **AutomationAction**: Log of all automation actions taken
- **RateLimit**: Per-feed rate limiting counters
- **JobQueue**: Database-backed job queue for background tasks

### 2. Job Queue System

Location: `lib/queue/`

The job queue uses PostgreSQL for reliable job storage and distribution:

```typescript
// Add a job
await jobQueue.addJob('PUBLISH_POST', {
  feedId: 'feed_123',
  scheduledPostId: 'post_456',
  // ...
}, {
  scheduledFor: new Date('2024-01-15T10:00:00Z'),
  maxAttempts: 3,
});

// Worker picks up jobs
const job = await jobQueue.getNextJob();
```

**Features:**
- Row-level locking for safe job distribution
- Automatic retry with exponential backoff
- Dead letter queue for failed jobs
- Priority-based scheduling
- Scheduled jobs (future execution)

### 3. Worker Process

Location: `lib/worker/`

Workers process jobs from the queue:

- **Job Processor**: Handles different job types (publish, like, comment, etc.)
- **Worker**: Main loop that polls for and processes jobs

**Running Workers:**

Development (via API):
```bash
# Start inline worker
curl -X POST http://localhost:3000/api/worker?mode=start

# Process single job
curl -X POST http://localhost:3000/api/worker?mode=single

# Process batch of jobs
curl -X POST http://localhost:3000/api/worker?mode=batch&max=20
```

Production:
```bash
# Run dedicated worker process (after building)
node dist/lib/worker/worker.js
```

### 4. Rate Limiting

Location: `lib/rate-limit/`

Enforces Instagram's API limits per feed:

| Action   | Daily Limit | Hourly Limit |
|----------|-------------|--------------|
| Likes    | 150         | 30           |
| Comments | 30          | 10           |
| Follows  | 50          | 15           |
| DMs      | 20          | 5            |
| Publish  | 25          | 10           |

```typescript
// Check if action is allowed
const status = await rateLimiter.checkLimit(feedId, 'LIKE');
if (!status.allowed) {
  console.log('Rate limited:', status.blockReason);
}

// Record an action
await rateLimiter.recordAction(feedId, 'LIKE');
```

## API Endpoints

### Scheduler API (`/api/scheduler`)
- `GET` - List scheduled posts
- `POST` - Create scheduled post
- `PUT` - Update scheduled post
- `DELETE` - Delete scheduled post

### Automation API (`/api/automation`)
- `GET` - List automation rules and actions
- `POST` - Create automation rule
- `PUT` - Update automation rule
- `DELETE` - Delete automation rule

### Rate Limits API (`/api/rate-limits`)
- `GET` - Get rate limit status
- `POST` - Record an action
- `PUT` - Update custom limits
- `DELETE` - Clear a block

### Queue API (`/api/queue`)
- `GET` - Get queue status
- `POST` - Add job (admin)
- `DELETE` - Cancel job or cleanup

### Worker API (`/api/worker`)
- `GET` - Get worker status
- `POST` - Process jobs or start/stop inline worker

## Database Schema

The schema is defined in `prisma/schema-extensions.prisma`. To apply:

1. Merge the models into `prisma/schema.prisma`
2. Run: `npm run db:migrate`
3. Run: `npm run db:generate`

## Scaling Strategies

### Horizontal Scaling

1. **Web Servers**: Add more Next.js instances behind a load balancer
2. **Workers**: Run multiple worker instances with different worker IDs
3. **Database**: Use read replicas for analytics queries

### Vertical Scaling

1. Increase worker concurrency (default: 3)
2. Reduce poll interval (default: 5 seconds)
3. Increase database connection pool

### Performance Optimizations

1. **Batch Processing**: Queue multiple actions and process together
2. **Connection Pooling**: Prisma handles this automatically
3. **Caching**: Add Redis for frequently accessed data
4. **Indexing**: Database indexes on frequently queried columns

## Monitoring

### Queue Health
```bash
curl http://localhost:3000/api/queue
# Returns: { stats: { pending, processing, completed, failed, total } }
```

### Rate Limit Status
```bash
curl http://localhost:3000/api/rate-limits?feed_id=feed_123
# Returns: { limits: {...}, daily_usage: {...} }
```

### Worker Status
```bash
curl http://localhost:3000/api/worker
# Returns: { inline_worker: {...}, queue: {...} }
```

## Production Checklist

- [ ] Set up PostgreSQL with proper connection pooling
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Deploy web servers with load balancer
- [ ] Start worker processes (separate from web servers)
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Test rate limiting under load

## Upgrading to Redis (Optional)

For higher scale (50,000+ users), consider upgrading to Redis + BullMQ:

1. Install Redis server
2. Replace `DatabaseQueue` with `BullMQ` implementation
3. Update worker to use BullMQ's built-in worker class
4. Benefits: faster processing, better real-time features, pub/sub support
