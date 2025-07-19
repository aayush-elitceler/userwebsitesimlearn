import { Card } from "@/components/ui/card";
import InsRegistrationForm from "@/components/AiChatRegform";
import BackGroundLogo from "@/public/images/BackgroundImage.svg";

function RegisterComponent() {
  return (
    <div
      className="flex items-center justify-center min-h-screen relative"
      style={{
        backgroundImage: `url(${BackGroundLogo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/newBg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="container mx-auto px-2 sm:px-4 z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full">
          {/* Left Section with Illustration */}
          <div className="w-full lg:w-1/2 flex justify-center mb-8 lg:mb-0">
            <div className="flex items-center justify-center w-full">
              <img
                src="/images/roboLogin.svg"
                alt="AI Robot Illustration"
                className="max-w-[320px] sm:max-w-[400px] md:max-w-[480px] w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Right Section with Form */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl backdrop-blur-sm rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl">
              <div className="flex flex-col items-start w-full">
                <div className="text-2xl sm:text-3xl md:text-4xl text-white font-bold mb-2 leading-tight">
                  SIGN IN TO YOUR <br /> <span className="text-[#007437]">ADVENTURE!</span>
                </div>
                <div className="w-full mt-4 sm:mt-6 overflow-x-auto">
                  <InsRegistrationForm />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterComponent;
