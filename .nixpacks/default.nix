{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.openssl       # OpenSSL 3.x
    pkgs.pkg-config    # For Prisma linking
  ];

  shellHook = ''
    export OPENSSL_DIR=${pkgs.openssl}
    export LD_LIBRARY_PATH=${pkgs.openssl.out}/lib:$LD_LIBRARY_PATH
  '';
}
