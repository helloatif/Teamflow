import swaggerJSDoc from 'swagger-jsdoc';

const bearerSecurity = [{ bearerAuth: [] }];
const jsonResponse = (description: string, schema = { $ref: '#/components/schemas/SuccessResponse' }) => ({
  description,
  content: { 'application/json': { schema } },
});
const errorResponses = {
  400: jsonResponse('Invalid request', { $ref: '#/components/schemas/ErrorResponse' }),
  401: jsonResponse('Authentication required', { $ref: '#/components/schemas/ErrorResponse' }),
  403: jsonResponse('Insufficient permissions', { $ref: '#/components/schemas/ErrorResponse' }),
  404: jsonResponse('Resource not found', { $ref: '#/components/schemas/ErrorResponse' }),
};
const uuid = (name: string, description: string) => ({ name, in: 'path', required: true, description, schema: { type: 'string', format: 'uuid' } });

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'TeamFlow API',
      version: '1.0.0',
      description: 'REST API for TeamFlow, a collaborative project management platform.',
    },
    servers: [{ url: '/', description: 'Current server' }],
    tags: [
      { name: 'Health', description: 'Service health checks' },
      { name: 'Auth', description: 'Registration and token-based authentication' },
      { name: 'Users', description: 'Authenticated user profile' },
      { name: 'Teams', description: 'Teams and team membership' },
      { name: 'Projects', description: 'Projects inside teams' },
      { name: 'Tasks', description: 'Tasks inside projects' },
      { name: 'Comments', description: 'Task comments' },
      { name: 'Activity', description: 'Team activity history' },
      { name: 'Notifications', description: 'Database-backed user notifications' },
    ],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        SuccessResponse: { type: 'object', required: ['success', 'data'], properties: { success: { type: 'boolean', example: true }, data: {} } },
        ErrorResponse: { type: 'object', required: ['success', 'message'], properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Invalid request' } } },
        AuthPayload: {
          type: 'object', required: ['name', 'email', 'password'],
          properties: { name: { type: 'string', minLength: 2, maxLength: 100 }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password', minLength: 8 } },
        },
        LoginPayload: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } },
        TeamInput: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 2, maxLength: 100 }, description: { type: 'string', nullable: true } } },
        ProjectInput: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1, maxLength: 150 }, description: { type: 'string', nullable: true }, status: { $ref: '#/components/schemas/ProjectStatus' } } },
        TaskInput: { type: 'object', required: ['title'], properties: { title: { type: 'string', minLength: 1, maxLength: 200 }, description: { type: 'string', nullable: true }, status: { $ref: '#/components/schemas/TaskStatus' }, priority: { $ref: '#/components/schemas/TaskPriority' } } },
        CommentInput: { type: 'object', required: ['content'], properties: { content: { type: 'string', minLength: 1, maxLength: 2000 } } },
        TeamRole: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER'] },
        ProjectStatus: { type: 'string', enum: ['ACTIVE', 'ARCHIVED'] },
        TaskStatus: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
        TaskPriority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        ActivityEntityType: { type: 'string', enum: ['PROJECT', 'TASK', 'COMMENT', 'TEAM'] },
        ActivityAction: { type: 'string', enum: ['CREATED', 'UPDATED', 'DELETED', 'ASSIGNED', 'UNASSIGNED', 'STATUS_CHANGED', 'ROLE_CHANGED', 'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED'] },
        NotificationType: { type: 'string', enum: ['TASK_ASSIGNED', 'COMMENT_ADDED', 'TASK_COMPLETED', 'MENTION'] },
      },
    },
    paths: {
      '/health': { get: { tags: ['Health'], summary: 'Check root service health', description: 'Returns a minimal health response.', responses: { 200: jsonResponse('Service is healthy') } } },
      '/api/v1/health': { get: { tags: ['Health'], summary: 'Check API health', description: 'Returns the TeamFlow API health status.', responses: { 200: jsonResponse('API is healthy') } } },
      '/api/v1/auth/register': { post: { tags: ['Auth'], summary: 'Register a user', description: 'Creates a user and returns access and refresh tokens.', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthPayload' } } } }, responses: { 201: jsonResponse('User registered'), 400: errorResponses[400] } } },
      '/api/v1/auth/login': { post: { tags: ['Auth'], summary: 'Log in', description: 'Authenticates a user and returns access and refresh tokens.', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginPayload' } } } }, responses: { 200: jsonResponse('Login successful'), 400: errorResponses[400], 401: errorResponses[401] } } },
      '/api/v1/auth/logout': { post: { tags: ['Auth'], summary: 'Log out', description: 'Invalidates the current user session.', security: bearerSecurity, responses: { 200: jsonResponse('Logout successful'), 401: errorResponses[401] } } },
      '/api/v1/me': { get: { tags: ['Users'], summary: 'Get current user', description: 'Returns the JWT subject for the authenticated user.', security: bearerSecurity, responses: { 200: jsonResponse('Authenticated user profile'), 401: errorResponses[401] } } },
      '/api/v1/teams': {
        get: { tags: ['Teams'], summary: 'List my teams', description: 'Lists teams the authenticated user belongs to.', security: bearerSecurity, responses: { 200: jsonResponse('Teams returned'), 401: errorResponses[401] } },
        post: { tags: ['Teams'], summary: 'Create a team', description: 'Creates a team and makes the requester its OWNER.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamInput' } } } }, responses: { 201: jsonResponse('Team created'), 400: errorResponses[400], 401: errorResponses[401] } },
      },
      '/api/v1/teams/{teamId}': {
        parameters: [uuid('teamId', 'Team ID')],
        get: { tags: ['Teams'], summary: 'Get a team', description: 'Returns a team for one of its members.', security: bearerSecurity, responses: { 200: jsonResponse('Team returned'), ...errorResponses } },
        patch: { tags: ['Teams'], summary: 'Update a team', description: 'Updates a team. Requires OWNER or ADMIN.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamInput' } } } }, responses: { 200: jsonResponse('Team updated'), ...errorResponses } },
        delete: { tags: ['Teams'], summary: 'Delete a team', description: 'Deletes a team. Requires OWNER.', security: bearerSecurity, responses: { 200: jsonResponse('Team deleted'), ...errorResponses } },
      },
      '/api/v1/teams/{teamId}/members': {
        parameters: [uuid('teamId', 'Team ID')],
        get: { tags: ['Teams'], summary: 'List team members', description: 'Lists members of a team.', security: bearerSecurity, responses: { 200: jsonResponse('Members returned'), ...errorResponses } },
        post: { tags: ['Teams'], summary: 'Invite a member', description: 'Adds an existing user to a team. Requires OWNER or ADMIN.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'string', format: 'uuid' } } } } } }, responses: { 201: jsonResponse('Member invited'), ...errorResponses } },
      },
      '/api/v1/teams/{teamId}/members/{userId}': {
        parameters: [uuid('teamId', 'Team ID'), uuid('userId', 'User ID')],
        patch: { tags: ['Teams'], summary: 'Change a member role', description: 'Changes a member role. Requires OWNER.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { $ref: '#/components/schemas/TeamRole' } } } } } }, responses: { 200: jsonResponse('Role updated'), ...errorResponses } },
        delete: { tags: ['Teams'], summary: 'Remove a member', description: 'Removes a member. OWNER can remove anyone; ADMIN can remove MEMBER.', security: bearerSecurity, responses: { 200: jsonResponse('Member removed'), ...errorResponses } },
      },
      '/api/v1/teams/{teamId}/projects': {
        parameters: [uuid('teamId', 'Team ID')],
        get: { tags: ['Projects'], summary: 'List team projects', description: 'Lists projects visible to team members.', security: bearerSecurity, responses: { 200: jsonResponse('Projects returned'), ...errorResponses } },
        post: { tags: ['Projects'], summary: 'Create a project', description: 'Creates a project. Requires OWNER or ADMIN.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectInput' } } } }, responses: { 201: jsonResponse('Project created'), ...errorResponses } },
      },
      '/api/v1/teams/{teamId}/projects/{projectId}': {
        parameters: [uuid('teamId', 'Team ID'), uuid('projectId', 'Project ID')],
        get: { tags: ['Projects'], summary: 'Get a project', description: 'Returns a project visible to team members.', security: bearerSecurity, responses: { 200: jsonResponse('Project returned'), ...errorResponses } },
        patch: { tags: ['Projects'], summary: 'Update a project', description: 'Updates a project. Requires OWNER or ADMIN.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectInput' } } } }, responses: { 200: jsonResponse('Project updated'), ...errorResponses } },
        delete: { tags: ['Projects'], summary: 'Delete a project', description: 'Deletes a project. Requires OWNER.', security: bearerSecurity, responses: { 200: jsonResponse('Project deleted'), ...errorResponses } },
      },
      '/api/v1/projects/{projectId}/tasks': {
        parameters: [uuid('projectId', 'Project ID')],
        get: { tags: ['Tasks'], summary: 'List project tasks', description: 'Lists tasks for a project. Any project team member may read.', security: bearerSecurity, responses: { 200: jsonResponse('Tasks returned'), ...errorResponses } },
        post: { tags: ['Tasks'], summary: 'Create a task', description: 'Creates a task. Requires OWNER or ADMIN.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } } }, responses: { 201: jsonResponse('Task created'), ...errorResponses } },
      },
      '/api/v1/projects/{projectId}/tasks/{taskId}': {
        parameters: [uuid('projectId', 'Project ID'), uuid('taskId', 'Task ID')],
        get: { tags: ['Tasks'], summary: 'Get a task', description: 'Returns a task. Any project team member may read.', security: bearerSecurity, responses: { 200: jsonResponse('Task returned'), ...errorResponses } },
        patch: { tags: ['Tasks'], summary: 'Update a task', description: 'Updates title, description, status, or priority. Requires OWNER or ADMIN.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } } }, responses: { 200: jsonResponse('Task updated'), ...errorResponses } },
        delete: { tags: ['Tasks'], summary: 'Delete a task', description: 'Deletes a task. Requires OWNER or ADMIN.', security: bearerSecurity, responses: { 200: jsonResponse('Task deleted'), ...errorResponses } },
      },
      '/api/v1/projects/{projectId}/tasks/{taskId}/assignee': { patch: { tags: ['Tasks'], summary: 'Assign or unassign a task', description: 'Sets assigneeId to a team member UUID, or null to unassign. Requires OWNER or ADMIN.', security: bearerSecurity, parameters: [uuid('projectId', 'Project ID'), uuid('taskId', 'Task ID')], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['assigneeId'], properties: { assigneeId: { type: 'string', format: 'uuid', nullable: true } } } } } }, responses: { 200: jsonResponse('Assignee updated'), ...errorResponses } } },
      '/api/v1/projects/{projectId}/tasks/{taskId}/comments': {
        parameters: [uuid('projectId', 'Project ID'), uuid('taskId', 'Task ID')],
        get: { tags: ['Comments'], summary: 'List task comments', description: 'Lists comments. Any project team member may read.', security: bearerSecurity, responses: { 200: jsonResponse('Comments returned'), ...errorResponses } },
        post: { tags: ['Comments'], summary: 'Create a comment', description: 'Creates a comment. Any project team member may write.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CommentInput' } } } }, responses: { 201: jsonResponse('Comment created'), ...errorResponses } },
      },
      '/api/v1/projects/{projectId}/tasks/{taskId}/comments/{commentId}': {
        parameters: [uuid('projectId', 'Project ID'), uuid('taskId', 'Task ID'), uuid('commentId', 'Comment ID')],
        patch: { tags: ['Comments'], summary: 'Update a comment', description: 'Updates a comment. Allowed for its author or the team OWNER.', security: bearerSecurity, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CommentInput' } } } }, responses: { 200: jsonResponse('Comment updated'), ...errorResponses } },
        delete: { tags: ['Comments'], summary: 'Delete a comment', description: 'Deletes a comment. Allowed for its author or the team OWNER.', security: bearerSecurity, responses: { 200: jsonResponse('Comment deleted'), ...errorResponses } },
      },
      '/api/v1/teams/{teamId}/activity': { get: { tags: ['Activity'], summary: 'List team activity', description: 'Lists newest activity first. Any team member may read.', security: bearerSecurity, parameters: [uuid('teamId', 'Team ID'), { name: 'entityType', in: 'query', schema: { $ref: '#/components/schemas/ActivityEntityType' } }, { name: 'action', in: 'query', schema: { $ref: '#/components/schemas/ActivityAction' } }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } }], responses: { 200: jsonResponse('Activity returned'), ...errorResponses } } },
      '/api/v1/notifications': { get: { tags: ['Notifications'], summary: 'List my notifications', description: 'Lists the authenticated user’s notifications, newest first.', security: bearerSecurity, parameters: [{ name: 'unread', in: 'query', schema: { type: 'boolean' } }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } }], responses: { 200: jsonResponse('Notifications returned'), 400: errorResponses[400], 401: errorResponses[401] } } },
      '/api/v1/notifications/read-all': { patch: { tags: ['Notifications'], summary: 'Mark all notifications read', description: 'Marks every notification owned by the authenticated user as read.', security: bearerSecurity, responses: { 200: jsonResponse('Notifications marked read'), 401: errorResponses[401] } } },
      '/api/v1/notifications/{notificationId}/read': { patch: { tags: ['Notifications'], summary: 'Mark one notification read', description: 'Marks one notification owned by the authenticated user as read.', security: bearerSecurity, parameters: [uuid('notificationId', 'Notification ID')], responses: { 200: jsonResponse('Notification marked read'), ...errorResponses } } },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
