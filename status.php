
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Server Status - Indikrea Hosting</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'primary': {
                '500': '#06b6d4',
                '600': '#0891b2',
              },
            }
          }
        }
      }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body {
            background-color: #f3f4f6;
        }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen">

    <div class="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
        <div class="flex items-center justify-center">
            <i class="fas fa-server text-4xl text-primary-500"></i>
            <h1 class="text-3xl font-bold ml-4 text-gray-800">Indikrea Server Status</h1>
        </div>

        <div class="p-6 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md">
            <p class="font-bold text-lg">All Systems Operational</p>
        </div>

        <div class="text-gray-600">
            <p>This is a sample PHP page demonstrating server-side script integration with the React application.</p>
            <p class="mt-4 font-mono p-4 bg-gray-100 rounded-md">
                Server Time: <span class="font-semibold text-gray-800"><?php echo date('Y-m-d H:i:s T'); ?></span>
            </p>
        </div>

        <div class="pt-4 border-t">
            <a href="/#/" class="font-medium text-primary-600 hover:text-primary-500">
                &larr; Back to Main Site
            </a>
        </div>
    </div>

</body>
</html>
