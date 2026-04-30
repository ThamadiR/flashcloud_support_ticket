import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from "react";

interface DrawerContextType {
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  return (
    <DrawerContext.Provider
      value={{
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = (): DrawerContextType => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
};
