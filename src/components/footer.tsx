"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useState } from "react";

interface FooterProps {
  hintText?: string;
}

export default function Footer({ hintText }: FooterProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const [isHintHovered, setIsHintHovered] = useState(false);

  return (
    <>
      <footer className="mt-auto w-full">
        <div className="w-full px-8 py-6">
          <div className="flex flex-col items-center justify-center border-t border-gray-800 pt-6 text-center">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()}{" "}
              {hintText ? (
                <button
                  type="button"
                  onClick={() => setHintOpen(true)}
                  onMouseEnter={() => setIsHintHovered(true)}
                  onMouseLeave={() => setIsHintHovered(false)}
                  className="text-gray-600 transition-colors hover:text-gray-500"
                >
                  {isHintHovered ? "hint" : "All rights"}
                </button>
              ) : "All rights"}{" "}
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {hintText && (
        <Dialog open={hintOpen} onOpenChange={setHintOpen}>
          <DialogContent className="max-w-sm border-blue-500/40 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>Hint</DialogTitle>
              <DialogDescription className="text-gray-300">
                {hintText}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
