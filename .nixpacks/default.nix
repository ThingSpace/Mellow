{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.openssl           # OpenSSL 3.x
    pkgs.pkg-config        # Needed to locate libraries
    pkgs.gcc               # For compiling Prisma engines
    pkgs.make              # For build tools
  ];

  shellHook = ''
    export OPENSSL_DIR=${pkgs.openssl}
    export PKG_CONFIG_PATH=${pkgs.openssl.dev}/lib/pkgconfig
  '';
}
