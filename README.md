# Bones Publish Action

A GitHub Action for publishing build artifacts to release on
[bones](https://github.com/WiIIiam278/bones).

## Example usage

```yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: 'Publish to William278.net 🚀'
        uses: WiIIiam278/bones-publish-action@v1
        with:
          api-key: ${{ secrets.BONES_API_KEY }} # Put this in a secret!
          project: 'project'
          channel: 'release'
          version: '1.0'
          changelog: 'Removed herobrine'
          distro-names: |
            paper
          distro-groups: |
            paper
          distro-descriptions: |
            Paper
          files: |
            target/file.jar
```
