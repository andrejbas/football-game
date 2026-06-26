<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Register the admin alias so routes can use middleware('admin')
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        // Ensure all API responses are JSON
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // Render all unhandled exceptions as JSON for API consumers
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {

                if ($e instanceof ValidationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed.',
                        'errors'  => $e->errors(),
                    ], 422);
                }

                if ($e instanceof NotFoundHttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Resource not found.',
                    ], 404);
                }

                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated.',
                    ], 401);
                }

                if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Forbidden.',
                    ], 403);
                }

                // Generic 500 for anything else (hide internals in production)
                $message = app()->hasDebugModeEnabled()
                    ? $e->getMessage()
                    : 'An unexpected error occurred.';

                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 500);
            }
        });
    })
    ->create();