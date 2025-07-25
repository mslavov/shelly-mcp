# NPM Publishing Guide for shelly-mcp

## Pre-publish Checklist

✅ Package.json is configured with all required fields
✅ .npmignore file created to exclude unnecessary files
✅ LICENSE file added (MIT)
✅ Project builds successfully
✅ README.md with comprehensive documentation

## Steps to Publish

### 1. Update Package Information

Edit `package.json` to replace placeholder values:
- `author`: Replace with your name and email
- `repository.url`: Replace with your GitHub repository URL
- `bugs.url`: Replace with your GitHub issues URL
- `homepage`: Replace with your GitHub repository README URL

Edit `LICENSE` file:
- Replace `[Your Name]` with your actual name

### 2. Test Package Locally

```bash
# Create a package tarball
npm pack

# Check what files will be included
npm pack --dry-run

# Test installation locally
npm install ./shelly-mcp-0.1.0.tgz
```

### 3. Login to NPM

```bash
# Login to npm (you need an npm account)
npm login
```

### 4. Check Package Name Availability

```bash
# Check if the name is available
npm view shelly-mcp
```

If the name is taken, update the `name` field in package.json.

### 5. Publish to NPM

```bash
# Publish publicly
npm publish

# Or publish with public access explicitly
npm publish --access public
```

### 6. Verify Publication

```bash
# View your published package
npm view shelly-mcp

# Test installation
npm install -g shelly-mcp
```

## Post-Publish Steps

1. **Create a Git Tag**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **Update GitHub Repository**
   - Add npm badge to README: `[![npm version](https://badge.fury.io/js/shelly-mcp.svg)](https://www.npmjs.com/package/shelly-mcp)`
   - Create a GitHub release for v0.1.0

3. **Announce**
   - Share on social media
   - Post in relevant forums/communities
   - Update any documentation sites

## Version Management

For future updates:

```bash
# Patch release (0.1.0 -> 0.1.1)
npm version patch

# Minor release (0.1.0 -> 0.2.0)
npm version minor

# Major release (0.1.0 -> 1.0.0)
npm version major

# Then publish
npm publish
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Run `npm login` again
   - Check npm account credentials

2. **Package Name Taken**
   - Choose a different name
   - Consider scoped package: `@yourusername/shelly-mcp`

3. **Missing Files in Package**
   - Check `.npmignore` configuration
   - Use `npm pack --dry-run` to verify

4. **Build Errors**
   - Run `npm run build` before publishing
   - Ensure TypeScript compiles without errors

### Useful Commands

```bash
# View package info
npm info shelly-mcp

# List package versions
npm view shelly-mcp versions

# Deprecate a version
npm deprecate shelly-mcp@0.1.0 "Critical bug, please upgrade"

# Unpublish (within 72 hours)
npm unpublish shelly-mcp@0.1.0
```

## Security Best Practices

1. **Enable 2FA on npm account**
2. **Use npm access tokens for CI/CD**
3. **Review dependencies regularly**
4. **Never publish with sensitive data**

Remember: Once published, packages cannot be completely removed after 72 hours!