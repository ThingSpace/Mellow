{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.bun         # Bun runtime / package manager
    pkgs.nodejs      # Node.js runtime (needed for Prisma CLI)
    pkgs.pkg-config  # Required for building some native deps
    pkgs.gcc         # Build tools
    pkgs.make
  ];

  shellHook = ''
    # Use Prisma N-API engine to avoid libssl issues
    export PRISMA_FORCE_NAPI=true
  '';
}
