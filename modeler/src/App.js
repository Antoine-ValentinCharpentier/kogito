import { useEffect, useRef, useState } from "react";
import * as BpmnEditor from "@kogito-tooling/kie-editors-standalone/dist/bpmn";
import * as DmnEditor from "@kogito-tooling/kie-editors-standalone/dist/dmn";

const App = () => {
  const containerRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [editorType, setEditorType] = useState("bpmn"); 

  const openEditor = async (type, initialContent) => {
    if(editor){
      editor.close()
    }
    const editorInstance =
      type  === "bpmn"
          ? BpmnEditor.open({
              container: containerRef.current,
              initialContent: Promise.resolve(initialContent),
              readOnly: false,
            })
          : DmnEditor.open({
              container: containerRef.current,
              initialContent: Promise.resolve(initialContent),
              readOnly: false,
            });
    setEditor(editorInstance);
  }

  useEffect(() => {
    openEditor(editorType)
  }, []);

  const handleDownload = async () => {
    if (editor) {
      const content = await editor.getContent();
      const blob = new Blob([content], { type: "application/xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `diagram.${editorType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop();

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        if (fileExtension !== editorType) {
          console.log("là")
          await handleTypeChange(fileExtension, content)
        }else {
          console.log('here')
          await editor.setContent("test", content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUndo = () => {
    if (editor) {
      editor.undo();
    }
  };

  const handleRedo = () => {
    if (editor) {
      editor.redo();
    }
  };

  const handleTypeChange = async (type, content="") => {
    setEditorType(type)
    openEditor(type, content)
  }

  return (
    <div>
      <select onChange={(e) => handleTypeChange(e.target.value)} value={editorType}>
        <option value="bpmn">BPMN Editor</option>
        <option value="dmn">DMN Editor</option>
      </select>
      <button onClick={handleDownload}>Download the {editorType.toUpperCase()}</button>
      <input type="file" accept=".bpmn,.dmn" onChange={handleUpload} />
      <button onClick={handleUndo} disabled={!editor}>Undo</button>
      <button onClick={handleRedo} disabled={!editor}>Redo</button>
      <div ref={containerRef} style={{ height: "calc(100vh - 50px)" }}></div>
    </div>
  );
};

export default App;
