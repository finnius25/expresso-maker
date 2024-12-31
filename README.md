# express-firebase-generator

A CLI tool to quickly generate Express.js projects with optional Firebase integration.

## Installation

```bash
npm install -g expresso-maker
```

## Usage

### Create a new project

```bash
# Create a basic Express project
expresso new my-project

# Create an Express project with Firebase integration
expresso new my-project --firebase
```

### Generate a test resource

From within your project directory:

```bash
expresso generate-resource product
```

This will create:
- A controller with a test endpoint
- A route configuration
- Automatically register the route

The generated endpoint will be available at `/api/products/test`

## Project Structure

```
my-project/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── lib/        (if --firebase flag used)
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
└── package.json
```

## Requirements

- Node.js >= 14.0.0
- If using Firebase, you'll need to set up your Firebase credentials

## License

MIT