import React from "react";
import Markdown from "react-markdown";
import { Button } from "./ui/button";

const CreationItem = ({ item }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)} // toggle expand on click
      className="p-4 max-w-5xl text-sm 
        rounded-lg cursor-pointer  border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
    >
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="font-semibold text-white">{item.prompt}</h2>
          <p className="text-white text-xs">
            {item.type} -{" "}
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
        <Button className=" hover:text-accent-foreground dark:hover:bg-white-900 bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60">
          {item.type}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4">
          {item.type === "image" ? (
            <img
              src={item.content}
              alt="image"
              className="mt-3 w-full max-w-md rounded-md"
            />
          ) : (
            <div className="prose prose-sm max-w-none text-gray-800">
              <Markdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-2xl font-bold text-gray-900 mb-3"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-semibold text-gray-800 mt-4 mb-2"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-lg font-semibold text-gray-700 mt-3 mb-2"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-3 leading-relaxed" {...props} />
                  ),
                  code: ({ node, inline, className, ...props }) =>
                    inline ? (
                      <code
                        className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"
                        {...props}
                      />
                    ) : (
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-sm">
                        <code {...props} />
                      </pre>
                    ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-gray-300 pl-3 italic text-gray-600"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc list-inside mb-3 space-y-1"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal list-inside mb-3 space-y-1"
                      {...props}
                    />
                  ),
                }}
              >
                {item.content}
              </Markdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreationItem;
