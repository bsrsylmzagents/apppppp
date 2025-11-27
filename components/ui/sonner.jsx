import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  // Uygulama kendi tema sistemini kullanıyor; Sonner için sabit "light"
  // kullanmak, hata vermeden uyumlu görünüm sağlıyor.
  const theme = "light"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }

