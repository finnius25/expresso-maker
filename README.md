# expresso-maker ☕️

> *"I'm working late, 'cause I'm a expresso-maker"* - Inspired by Sabrina Carpenter's "Espresso"

A CLI tool to quickly generate Express.js projects with optional Firebase integration. Just like how Sabrina makes her espresso, we make your Express projects with a perfect blend of speed and quality.

## Installation

```bash
npm install -g expresso-maker
```

## Usage

### Create a new project

```bash
# Create a basic Express project (like a simple espresso shot)
expresso new my-project

# Create an Express project with Firebase integration (like an espresso with extra shots)
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